#[test_only]
module bond_craft::launchpad_tests;

use bond_craft::bonding_curve;
use bond_craft::launchpad::{Self, Launchpad};
use bond_craft::testtoken::TESTTOKEN;
use bond_craft::testusdc::TESTUSDC;
use sui::coin::{Self, Coin, CoinMetadata, TreasuryCap};
use sui::test_scenario::{Self as ts, Scenario};
use sui::test_utils::destroy;
use usdc::usdc::USDC;

// Test constants
const TOTAL_SUPPLY: u64 = 1_000_000_000; // 1B tokens (9 decimals)
const FUNDING_TOKENS: u64 = 400_000_000; // 400M tokens for funding
const CREATOR_TOKENS: u64 = 300_000_000; // 300M tokens for creator
const LIQUIDITY_TOKENS: u64 = 200_000_000; // 200M tokens for liquidity
const PLATFORM_TOKENS: u64 = 100_000_000; // 100M tokens for platform
const FUNDING_GOAL: u64 = 50_000_000_000; // 50,000 USDC (6 decimals)
const TOKEN_DECIMALS: u8 = 9;
const PURCHASE_AMOUNT: u64 = 1_000_000; // 1M tokens

public fun setup(ctx: &mut TxContext) {
    bond_craft::testtoken::test_init(ctx);
    bond_craft::testusdc::test_init(ctx);
}

// Helper function to create USDC coins for testing
fun mint_usdc(scenario: &mut Scenario, amount: u64, recipient: address): Coin<USDC> {
    ts::next_tx(scenario, recipient);
    let ctx = ts::ctx(scenario);

    coin::mint_for_testing<USDC>(amount, ctx)
}

#[test]
fun test_create_launchpad_success() {
    let admin = @0xA;
    let mut scenario = ts::begin(admin);

    let ctx = ts::ctx(&mut scenario);
    setup(ctx);

    ts::next_tx(&mut scenario, admin);
    let treasury = scenario.take_from_sender<TreasuryCap<TESTTOKEN>>();
    let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

    let ctx = ts::ctx(&mut scenario);
    let launchpad_id = launchpad::create(
        treasury,
        &metadata,
        TOTAL_SUPPLY,
        FUNDING_TOKENS,
        CREATOR_TOKENS,
        LIQUIDITY_TOKENS,
        PLATFORM_TOKENS,
        FUNDING_GOAL,
        admin,
        ctx,
    );

    // Verify launchpad properties
    ts::next_tx(&mut scenario, admin);
    {
        let launchpad = ts::take_shared_by_id<Launchpad<TESTTOKEN>>(&scenario, launchpad_id);

        assert!(launchpad::total_supply(&launchpad) == TOTAL_SUPPLY, 0);
        assert!(launchpad::funding_tokens(&launchpad) == FUNDING_TOKENS, 1);
        assert!(launchpad::creator_tokens(&launchpad) == CREATOR_TOKENS, 2);
        assert!(launchpad::liquidity_tokens(&launchpad) == LIQUIDITY_TOKENS, 3);
        assert!(launchpad::platform_tokens(&launchpad) == PLATFORM_TOKENS, 4);
        assert!(launchpad::funding_goal(&launchpad) == FUNDING_GOAL, 5);
        assert!(launchpad::tokens_sold(&launchpad) == 0, 6);
        assert!(launchpad::phase(&launchpad) == 0, 7); // PHASE_OPEN
        assert!(launchpad::creator(&launchpad) == admin, 8);
        assert!(launchpad::platform_admin(&launchpad) == admin, 9);
        assert!(launchpad::funding_balance(&launchpad) == 0, 10);
        assert!(launchpad::vesting_start_epoch(&launchpad) == 0, 11);
        assert!(launchpad::k(&launchpad) > 0, 12);

        ts::return_shared(launchpad)
    };

    destroy(metadata);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = launchpad::EInvalidAllocation)]
fun test_create_launchpad_invalid_allocation() {
    let admin = @0xA;
    let mut scenario = ts::begin(admin);

    let ctx = ts::ctx(&mut scenario);
    setup(ctx);

    ts::next_tx(&mut scenario, admin);
    let treasury = scenario.take_from_sender<TreasuryCap<TESTTOKEN>>();
    let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

    let ctx = ts::ctx(&mut scenario);
    let _launchpad_id = launchpad::create(
        treasury,
        &metadata,
        TOTAL_SUPPLY,
        FUNDING_TOKENS + 1, // Invalid allocation (exceeds total supply)
        CREATOR_TOKENS,
        LIQUIDITY_TOKENS,
        PLATFORM_TOKENS,
        FUNDING_GOAL,
        admin,
        ctx,
    );

    ts::return_to_sender(&scenario, metadata);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = launchpad::EInvalidFundingGoal)] // EInvalidFundingGoal
fun test_create_launchpad_zero_funding_goal() {
    let admin = @0xA;
    let mut scenario = ts::begin(admin);

    let ctx = ts::ctx(&mut scenario);
    setup(ctx);

    ts::next_tx(&mut scenario, admin);
    let treasury = scenario.take_from_sender<TreasuryCap<TESTTOKEN>>();
    let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

    let ctx = ts::ctx(&mut scenario);
    let _launchpad_id = launchpad::create(
        treasury,
        &metadata,
        TOTAL_SUPPLY,
        FUNDING_TOKENS,
        CREATOR_TOKENS,
        LIQUIDITY_TOKENS,
        PLATFORM_TOKENS,
        0,
        admin,
        ctx,
    );

    ts::return_to_sender(&scenario, metadata);
    ts::end(scenario);
}

#[test]
fun test_buy_tokens_success() {
    let admin = @0xA;
    let buyer = @0xB;
    let mut scenario = ts::begin(admin);

    let ctx = ts::ctx(&mut scenario);
    setup(ctx);

    ts::next_tx(&mut scenario, admin);
    let treasury = scenario.take_from_sender<TreasuryCap<TESTTOKEN>>();
    let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

    ts::next_tx(&mut scenario, admin);
    let ctx = ts::ctx(&mut scenario);
    let launchpad_id = launchpad::create(
        treasury,
        &metadata,
        TOTAL_SUPPLY,
        FUNDING_TOKENS,
        CREATOR_TOKENS,
        LIQUIDITY_TOKENS,
        PLATFORM_TOKENS,
        FUNDING_GOAL,
        admin,
        ctx,
    );

    // Switch to buyer
    ts::next_tx(&mut scenario, buyer);
    let mut launchpad = ts::take_shared_by_id<Launchpad<TESTTOKEN>>(&scenario, launchpad_id);

    // Calculate required cost
    let k = launchpad::k(&launchpad);
    let cost = bonding_curve::calculate_cost(0, PURCHASE_AMOUNT, TOKEN_DECIMALS, k);

    // Switch to buyer before minting
    ts::next_tx(&mut scenario, buyer);
    let ctx = ts::ctx(&mut scenario);
    let payment = coin::mint_for_testing<USDC>(cost, ctx);

    ts::next_tx(&mut scenario, buyer);
    let ctx = ts::ctx(&mut scenario);
    // Buy tokens
    launchpad::buy_tokens(&mut launchpad, payment, PURCHASE_AMOUNT, ctx);

    // Verify state changes
    assert!(launchpad::tokens_sold(&launchpad) == PURCHASE_AMOUNT, 0);
    assert!(launchpad::funding_balance(&launchpad) == cost, 1);
    assert!(launchpad::phase(&launchpad) == 0, 2); // Still PHASE_OPEN

    destroy(launchpad);
    destroy(metadata);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = launchpad::EInsufficientPayment)]
fun test_buy_tokens_insufficient_payment() {
    let admin = @0xA;
    let buyer = @0xB;
    let mut scenario = ts::begin(admin);

    let ctx = ts::ctx(&mut scenario);
    setup(ctx);

    ts::next_tx(&mut scenario, admin);
    let treasury = scenario.take_from_sender<TreasuryCap<TESTTOKEN>>();
    let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

    ts::next_tx(&mut scenario, admin);
    let ctx = ts::ctx(&mut scenario);
    let launchpad_id = launchpad::create(
        treasury,
        &metadata,
        TOTAL_SUPPLY,
        FUNDING_TOKENS,
        CREATOR_TOKENS,
        LIQUIDITY_TOKENS,
        PLATFORM_TOKENS,
        FUNDING_GOAL,
        admin,
        ctx,
    );

    // Switch to buyer and get context once
    ts::next_tx(&mut scenario, buyer);
    let mut launchpad = ts::take_shared_by_id<Launchpad<TESTTOKEN>>(&scenario, launchpad_id);

    // Provide insufficient payment
    let payment = mint_usdc(&mut scenario, 1000, buyer); // Too little

    ts::next_tx(&mut scenario, buyer);
    let ctx = ts::ctx(&mut scenario);
    // This should fail
    launchpad::buy_tokens(&mut launchpad, payment, PURCHASE_AMOUNT, ctx);

    ts::return_to_sender(&scenario, launchpad);
    ts::return_to_sender(&scenario, metadata);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = launchpad::EExcessivePurchase)]
fun test_buy_tokens_excessive_purchase() {
    let admin = @0xA;
    let buyer = @0xB;
    let mut scenario = ts::begin(admin);

    let ctx = ts::ctx(&mut scenario);
    setup(ctx);

    ts::next_tx(&mut scenario, admin);
    let treasury = scenario.take_from_sender<TreasuryCap<TESTTOKEN>>();
    let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

    ts::next_tx(&mut scenario, admin);
    let ctx = ts::ctx(&mut scenario);
    let launchpad_id = launchpad::create(
        treasury,
        &metadata,
        TOTAL_SUPPLY,
        FUNDING_TOKENS,
        CREATOR_TOKENS,
        LIQUIDITY_TOKENS,
        PLATFORM_TOKENS,
        FUNDING_GOAL,
        admin,
        ctx,
    );

    // Switch to buyer
    ts::next_tx(&mut scenario, buyer);
    let mut launchpad = ts::take_shared_by_id<Launchpad<TESTTOKEN>>(&scenario, launchpad_id);

    let excessive_amount = 2_000_000 * (10u64).pow(TOKEN_DECIMALS); // 2M tokens (exceeds MAX_TOKENS_PER_TX)
    ts::next_tx(&mut scenario, buyer);
    let ctx = ts::ctx(&mut scenario);
    let payment = coin::mint_for_testing<USDC>(excessive_amount, ctx);

    ts::next_tx(&mut scenario, buyer);
    let ctx = ts::ctx(&mut scenario);
    // This should fail due to excessive purchase
    launchpad::buy_tokens(&mut launchpad, payment, excessive_amount, ctx);

    ts::return_to_sender(&scenario, launchpad);
    ts::return_to_sender(&scenario, metadata);
    ts::end(scenario);
}

#[test]
fun test_funding_goal_reached() {
    let admin = @0xA;
    let buyer = @0xB;
    let mut scenario = ts::begin(admin);

    let ctx = ts::ctx(&mut scenario);
    setup(ctx);

    ts::next_tx(&mut scenario, admin);
    let treasury = scenario.take_from_sender<TreasuryCap<TESTTOKEN>>();
    let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

    ts::next_tx(&mut scenario, admin);
    let ctx = ts::ctx(&mut scenario);
    let launchpad_id = launchpad::create(
        treasury,
        &metadata,
        TOTAL_SUPPLY,
        FUNDING_TOKENS,
        CREATOR_TOKENS,
        LIQUIDITY_TOKENS,
        PLATFORM_TOKENS,
        FUNDING_GOAL,
        admin,
        ctx,
    );

    // Switch to buyer
    ts::next_tx(&mut scenario, buyer);
    let mut launchpad = ts::take_shared_by_id<Launchpad<TESTTOKEN>>(&scenario, launchpad_id);

    ts::next_tx(&mut scenario, buyer);
    let ctx = ts::ctx(&mut scenario);
    let payment = coin::mint_for_testing<USDC>(FUNDING_GOAL + 1000000, ctx); // Extra to be safe

    ts::next_tx(&mut scenario, buyer);
    let ctx = ts::ctx(&mut scenario);
    launchpad::buy_tokens(&mut launchpad, payment, FUNDING_TOKENS, ctx);

    // Verify phase changed to CLOSED
    assert!(launchpad::phase(&launchpad) == 1, 0); // PHASE_CLOSED
    assert!(launchpad::vesting_start_epoch(&launchpad) > 0, 1);

    ts::return_to_sender(&scenario, launchpad);
    ts::return_to_sender(&scenario, metadata);
    ts::end(scenario);
}

// #[test]
// fun test_close_funding_by_creator() {
//     let admin = @0xA;
//     let mut scenario = ts::begin(admin);

//     let ctx = ts::ctx(&mut scenario);
//     setup(ctx);

//     ts::next_tx(&mut scenario, admin);
//     let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

//     let ctx = ts::ctx(&mut scenario);
//     let mut launchpad = launchpad::create_test<TESTTOKEN>(
//         ctx,
//         &metadata,
//         TOKEN_DECIMALS,
//         TOTAL_SUPPLY,
//         FUNDING_TOKENS,
//         CREATOR_TOKENS,
//         LIQUIDITY_TOKENS,
//         PLATFORM_TOKENS,
//         FUNDING_GOAL,
//         admin,
//     );

//     // Creator closes funding
//     launchpad::close_funding(&mut launchpad, ctx);

//     // Verify phase changed
//     assert!(launchpad::phase(&launchpad) == 1, 0); // PHASE_CLOSED
//     assert!(launchpad::vesting_start_epoch(&launchpad) > 0, 1);

//     ts::return_to_sender(&scenario, launchpad);
//     ts::return_to_sender(&scenario, metadata);
//     ts::end(scenario);
// }

// #[test]
// #[expected_failure(abort_code = launchpad::EUnauthorized)]
// fun test_close_funding_unauthorized() {
//     let admin = @0xA;
//     let unauthorized = @0xB;
//     let mut scenario = ts::begin(admin);

//     let ctx = ts::ctx(&mut scenario);
//     setup(ctx);

//     ts::next_tx(&mut scenario, admin);
//     let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

//     let ctx = ts::ctx(&mut scenario);
//     let mut launchpad = launchpad::create_test<TESTTOKEN>(
//         ctx,
//         &metadata,
//         TOKEN_DECIMALS,
//         TOTAL_SUPPLY,
//         FUNDING_TOKENS,
//         CREATOR_TOKENS,
//         LIQUIDITY_TOKENS,
//         PLATFORM_TOKENS,
//         FUNDING_GOAL,
//         admin,
//     );

//     // Switch to unauthorized user
//     ts::next_tx(&mut scenario, unauthorized);
//     let ctx = ts::ctx(&mut scenario);

//     // This should fail
//     launchpad::close_funding(&mut launchpad, ctx);

//     ts::return_to_sender(&scenario, launchpad);
//     ts::return_to_sender(&scenario, metadata);
//     ts::end(scenario);
// }

// #[test]
// fun test_claim_creator_tokens() {
//     let admin = @0xA;
//     let mut scenario = ts::begin(admin);

//     let ctx = ts::ctx(&mut scenario);
//     setup(ctx);

//     ts::next_tx(&mut scenario, admin);
//     let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

//     let ctx = ts::ctx(&mut scenario);
//     let mut launchpad = launchpad::create_test<TESTTOKEN>(
//         ctx,
//         &metadata,
//         TOKEN_DECIMALS,
//         TOTAL_SUPPLY,
//         FUNDING_TOKENS,
//         CREATOR_TOKENS,
//         LIQUIDITY_TOKENS,
//         PLATFORM_TOKENS,
//         FUNDING_GOAL,
//         admin,
//     );

//     // Close funding first
//     launchpad::close_funding(&mut launchpad, ctx);

//     // Claim creator tokens
//     launchpad::claim_creator_tokens(&mut launchpad, ctx);

//     // Verify tokens were set to 0 (prevents re-claiming)
//     assert!(launchpad::creator_tokens(&launchpad) == 0, 0);

//     ts::return_to_sender(&scenario, launchpad);
//     ts::return_to_sender(&scenario, metadata);
//     ts::end(scenario);
// }

// #[test]
// #[expected_failure(abort_code = launchpad::EInvalidPhase)]
// fun test_claim_creator_tokens_wrong_phase() {
//     let admin = @0xA;
//     let mut scenario = ts::begin(admin);

//     let ctx = ts::ctx(&mut scenario);
//     setup(ctx);

//     ts::next_tx(&mut scenario, admin);
//     let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

//     let ctx = ts::ctx(&mut scenario);
//     let mut launchpad = launchpad::create_test<TESTTOKEN>(
//         ctx,
//         &metadata,
//         TOKEN_DECIMALS,
//         TOTAL_SUPPLY,
//         FUNDING_TOKENS,
//         CREATOR_TOKENS,
//         LIQUIDITY_TOKENS,
//         PLATFORM_TOKENS,
//         FUNDING_GOAL,
//         admin,
//     );

//     // Try to claim before closing funding (should fail)
//     launchpad::claim_creator_tokens(&mut launchpad, ctx);

//     ts::return_to_sender(&scenario, launchpad);
//     ts::return_to_sender(&scenario, metadata);
//     ts::end(scenario);
// }

// #[test]
// fun test_claim_platform_tokens() {
//     let admin = @0xA;
//     let mut scenario = ts::begin(admin);

//     let ctx = ts::ctx(&mut scenario);
//     setup(ctx);

//     ts::next_tx(&mut scenario, admin);
//     let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

//     let ctx = ts::ctx(&mut scenario);
//     let mut launchpad = launchpad::create_test<TESTTOKEN>(
//         ctx,
//         &metadata,
//         TOKEN_DECIMALS,
//         TOTAL_SUPPLY,
//         FUNDING_TOKENS,
//         CREATOR_TOKENS,
//         LIQUIDITY_TOKENS,
//         PLATFORM_TOKENS,
//         FUNDING_GOAL,
//         admin,
//     );

//     // Close funding first
//     launchpad::close_funding(&mut launchpad, ctx);

//     // Claim platform tokens
//     launchpad::claim_platform_tokens(&mut launchpad, ctx);

//     // Verify tokens were set to 0
//     assert!(launchpad::platform_tokens(&launchpad) == 0, 0);

//     ts::return_to_sender(&scenario, launchpad);
//     ts::return_to_sender(&scenario, metadata);
//     ts::end(scenario);
// }

// #[test]
// fun test_withdraw_funding() {
//     let admin = @0xA;
//     let buyer = @0xB;
//     let mut scenario = ts::begin(admin);

//     let ctx = ts::ctx(&mut scenario);
//     setup(ctx);

//     ts::next_tx(&mut scenario, admin);
//     let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

//     let ctx = ts::ctx(&mut scenario);
//     let mut launchpad = launchpad::create_test<TESTTOKEN>(
//         ctx,
//         &metadata,
//         TOKEN_DECIMALS,
//         TOTAL_SUPPLY,
//         FUNDING_TOKENS,
//         CREATOR_TOKENS,
//         LIQUIDITY_TOKENS,
//         PLATFORM_TOKENS,
//         FUNDING_GOAL,
//         admin,
//     );

//     // Add some funding first
//     ts::next_tx(&mut scenario, buyer);
//     let k = launchpad::k(&launchpad);
//     let cost = bonding_curve::calculate_cost(0, PURCHASE_AMOUNT, TOKEN_DECIMALS, k);

//     // Create new transaction for minting USDC
//     ts::next_tx(&mut scenario, buyer);
//     let ctx = ts::ctx(&mut scenario);
//     let payment = coin::mint_for_testing<USDC>(cost, ctx);

//     // Create new transaction for buying tokens
//     ts::next_tx(&mut scenario, buyer);
//     let ctx = ts::ctx(&mut scenario);
//     launchpad::buy_tokens(&mut launchpad, payment, PURCHASE_AMOUNT, ctx);

//     // Switch back to admin and close funding
//     ts::next_tx(&mut scenario, admin);
//     let ctx = ts::ctx(&mut scenario);
//     launchpad::close_funding(&mut launchpad, ctx);

//     // Withdraw some funding
//     let withdraw_amount = cost / 2;
//     launchpad::withdraw_funding(&mut launchpad, withdraw_amount, ctx);

//     // Verify balance decreased
//     assert!(launchpad::funding_balance(&launchpad) == cost - withdraw_amount, 0);

//     ts::return_to_sender(&scenario, launchpad);
//     ts::return_to_sender(&scenario, metadata);
//     ts::end(scenario);
// }

// #[test]
// #[expected_failure(abort_code = launchpad::EInsufficientTokens)]
// fun test_withdraw_funding_insufficient_balance() {
//     let admin = @0xA;
//     let mut scenario = ts::begin(admin);

//     let ctx = ts::ctx(&mut scenario);
//     setup(ctx);

//     ts::next_tx(&mut scenario, admin);
//     let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

//     let ctx = ts::ctx(&mut scenario);
//     let mut launchpad = launchpad::create_test<TESTTOKEN>(
//         ctx,
//         &metadata,
//         TOKEN_DECIMALS,
//         TOTAL_SUPPLY,
//         FUNDING_TOKENS,
//         CREATOR_TOKENS,
//         LIQUIDITY_TOKENS,
//         PLATFORM_TOKENS,
//         FUNDING_GOAL,
//         admin,
//     );

//     // Close funding
//     launchpad::close_funding(&mut launchpad, ctx);

//     // Try to withdraw more than available (should fail)
//     launchpad::withdraw_funding(&mut launchpad, 1000, ctx);

//     ts::return_to_sender(&scenario, launchpad);
//     ts::return_to_sender(&scenario, metadata);
//     ts::end(scenario);
// }

// #[test]
// fun test_bootstrap_liquidity() {
//     let admin = @0xA;
//     let buyer = @0xB;
//     let mut scenario = ts::begin(admin);

//     let ctx = ts::ctx(&mut scenario);
//     setup(ctx);

//     ts::next_tx(&mut scenario, admin);
//     let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

//     let ctx = ts::ctx(&mut scenario);
//     let mut launchpad = launchpad::create_test<TESTTOKEN>(
//         ctx,
//         &metadata,
//         TOKEN_DECIMALS,
//         TOTAL_SUPPLY,
//         FUNDING_TOKENS,
//         CREATOR_TOKENS,
//         LIQUIDITY_TOKENS,
//         PLATFORM_TOKENS,
//         FUNDING_GOAL,
//         admin,
//     );

//     // Add some funding
//     ts::next_tx(&mut scenario, buyer);
//     // let ctx = ts::ctx(&mut scenario);

//     let k = launchpad::k(&launchpad);
//     let cost = bonding_curve::calculate_cost(0, PURCHASE_AMOUNT, TOKEN_DECIMALS, k);

//     // Create new transaction for minting USDC
//     ts::next_tx(&mut scenario, buyer);
//     let ctx = ts::ctx(&mut scenario);
//     let payment = coin::mint_for_testing<USDC>(cost, ctx);

//     launchpad::buy_tokens(&mut launchpad, payment, PURCHASE_AMOUNT, ctx);

//     // Switch back to admin, close funding, then bootstrap liquidity
//     ts::next_tx(&mut scenario, admin);
//     let ctx = ts::ctx(&mut scenario);
//     launchpad::close_funding(&mut launchpad, ctx);
//     launchpad::bootstrap_liquidity_test(&mut launchpad, ctx);

//     // Verify phase changed
//     assert!(launchpad::phase(&launchpad) == 2, 0); // PHASE_LIQUIDITY_BOOTSTRAPPED

//     ts::return_to_sender(&scenario, launchpad);
//     ts::return_to_sender(&scenario, metadata);
//     ts::end(scenario);
// }

// #[test]
// fun test_current_price_calculation() {
//     let admin = @0xA;
//     let mut scenario = ts::begin(admin);

//     let ctx = ts::ctx(&mut scenario);
//     setup(ctx);

//     ts::next_tx(&mut scenario, admin);
//     let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

//     let ctx = ts::ctx(&mut scenario);
//     let launchpad = launchpad::create_test<TESTTOKEN>(
//         ctx,
//         &metadata,
//         TOKEN_DECIMALS,
//         TOTAL_SUPPLY,
//         FUNDING_TOKENS,
//         CREATOR_TOKENS,
//         LIQUIDITY_TOKENS,
//         PLATFORM_TOKENS,
//         FUNDING_GOAL,
//         admin,
//     );

//     // Initial price should be 0 (no tokens sold)
//     let initial_price = launchpad::current_price(&launchpad);
//     assert!(initial_price == 0, 0);

//     ts::return_to_sender(&scenario, launchpad);
//     ts::return_to_sender(&scenario, metadata);
//     ts::end(scenario);
// }

// #[test]
// fun test_multiple_purchases() {
//     let admin = @0xA;
//     let buyer1 = @0xB;
//     let buyer2 = @0xC;
//     let mut scenario = ts::begin(admin);

//     let ctx = ts::ctx(&mut scenario);
//     setup(ctx);

//     ts::next_tx(&mut scenario, admin);
//     let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

//     let ctx = ts::ctx(&mut scenario);
//     let mut launchpad = launchpad::create_test<TESTTOKEN>(
//         ctx,
//         &metadata,
//         TOKEN_DECIMALS,
//         TOTAL_SUPPLY,
//         FUNDING_TOKENS,
//         CREATOR_TOKENS,
//         LIQUIDITY_TOKENS,
//         PLATFORM_TOKENS,
//         FUNDING_GOAL,
//         admin,
//     );

//     // First purchase
//     ts::next_tx(&mut scenario, buyer1);
//     // let ctx = ts::ctx(&mut scenario);

//     let k = launchpad::k(&launchpad);
//     let cost1 = bonding_curve::calculate_cost(0, PURCHASE_AMOUNT, TOKEN_DECIMALS, k);

//     // Create new transaction for minting USDC
//     ts::next_tx(&mut scenario, buyer1);
//     let ctx = ts::ctx(&mut scenario);
//     let payment1 = coin::mint_for_testing<USDC>(cost1, ctx);

//     launchpad::buy_tokens(&mut launchpad, payment1, PURCHASE_AMOUNT, ctx);

//     // Second purchase (price should be higher)
//     ts::next_tx(&mut scenario, buyer2);
//     // let ctx = ts::ctx(&mut scenario);

//     let tokens_sold_after_first = launchpad::tokens_sold(&launchpad);
//     let cost2 = bonding_curve::calculate_cost(
//         tokens_sold_after_first,
//         PURCHASE_AMOUNT,
//         TOKEN_DECIMALS,
//         k,
//     );

//     // Create new transaction for minting USDC
//     ts::next_tx(&mut scenario, buyer2);
//     let ctx = ts::ctx(&mut scenario);
//     let payment2 = coin::mint_for_testing<USDC>(cost2, ctx);
//     launchpad::buy_tokens(&mut launchpad, payment2, PURCHASE_AMOUNT, ctx);

//     // Verify total tokens sold
//     assert!(launchpad::tokens_sold(&launchpad) == PURCHASE_AMOUNT * 2, 0);
//     assert!(launchpad::funding_balance(&launchpad) == cost1 + cost2, 1);

//     // Second purchase should cost more than first (bonding curve)
//     assert!(cost2 > cost1, 2);

//     ts::return_to_sender(&scenario, launchpad);
//     ts::return_to_sender(&scenario, metadata);
//     ts::end(scenario);
// }

// #[test]
// #[expected_failure(abort_code = launchpad::EInvalidPhase)]
// fun test_buy_tokens_after_funding_closed() {
//     let admin = @0xA;
//     let buyer = @0xB;
//     let mut scenario = ts::begin(admin);

//     let ctx = ts::ctx(&mut scenario);
//     setup(ctx);

//     ts::next_tx(&mut scenario, admin);
//     let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

//     let ctx = ts::ctx(&mut scenario);
//     let mut launchpad = launchpad::create_test<TESTTOKEN>(
//         ctx,
//         &metadata,
//         TOKEN_DECIMALS,
//         TOTAL_SUPPLY,
//         FUNDING_TOKENS,
//         CREATOR_TOKENS,
//         LIQUIDITY_TOKENS,
//         PLATFORM_TOKENS,
//         FUNDING_GOAL,
//         admin,
//     );

//     // Close funding
//     launchpad::close_funding(&mut launchpad, ctx);

//     // Try to buy tokens after funding is closed (should fail)
//     ts::next_tx(&mut scenario, buyer);
//     // let ctx = ts::ctx(&mut scenario);

//     // Create new transaction for minting USDC
//     ts::next_tx(&mut scenario, buyer);
//     let ctx = ts::ctx(&mut scenario);
//     let payment = coin::mint_for_testing<USDC>(1000, ctx);

//     launchpad::buy_tokens(&mut launchpad, payment, PURCHASE_AMOUNT, ctx);

//     ts::return_to_sender(&scenario, launchpad);
//     ts::return_to_sender(&scenario, metadata);
//     ts::end(scenario);
// }
