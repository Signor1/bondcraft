#[test_only]
module bond_craft::factory_test;

use bond_craft::factory::{Self, LaunchpadFactory};
use bond_craft::testtoken::{Self, TESTTOKEN};
use bond_craft::testusdc::{Self, TESTUSDC};
use sui::coin::{Self, TreasuryCap, CoinMetadata};
use sui::test_scenario::{Self as ts, Scenario};
use sui::test_utils::destroy;

// Constants for testing
const CREATOR: address = @0xCAFE;
const OTHER_USER: address = @0xBEEF;
const TOTAL_SUPPLY: u64 = 1_000_000_000_000_000; // 1M tokens with 9 decimals
const FUNDING_TOKENS: u64 = 400_000_000_000_000; // 400K tokens
const CREATOR_TOKENS: u64 = 300_000_000_000_000; // 300K tokens
const LIQUIDITY_TOKENS: u64 = 200_000_000_000_000; // 200K tokens
const PLATFORM_TOKENS: u64 = 100_000_000_000_000; // 100K tokens
const FUNDING_GOAL: u64 = 50_000_000_000; // 50K USDC (6 decimals)

// Test setup function
fun setup(ctx: &mut TxContext) {
    testtoken::test_init(ctx);
    testusdc::test_init(ctx);
    factory::test_init(ctx);
}

#[test]
fun test_factory_creation() {
    let mut scenario = ts::begin(CREATOR);
    let ctx = ts::ctx(&mut scenario);

    // Create factory
    setup(ctx);

    // Check factory was created and shared
    ts::next_tx(&mut scenario, CREATOR);
    let factory = ts::take_shared<LaunchpadFactory>(&scenario);

    // Verify initial state
    assert!(factory::get_launchpad_count(&factory) == 0, 0);
    assert!(vector::length(factory::get_all_launchpads(&factory)) == 0, 1);

    ts::return_shared(factory);
    ts::end(scenario);
}

#[test]
fun test_create_launchpad_success() {
    let mut scenario = ts::begin(CREATOR);
    let ctx = ts::ctx(&mut scenario);

    // Create factory
    setup(ctx);

    // Create test coin metadata
    ts::next_tx(&mut scenario, CREATOR);
    let treasury_cap = scenario.take_from_sender<TreasuryCap<TESTTOKEN>>();
    let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

    // Create launchpad
    ts::next_tx(&mut scenario, CREATOR);
    let mut factory = ts::take_shared<LaunchpadFactory>(&scenario);
    let ctx = ts::ctx(&mut scenario);

    factory::create_launchpad<TESTTOKEN>(
        &mut factory,
        treasury_cap,
        &metadata,
        TOTAL_SUPPLY,
        FUNDING_TOKENS,
        CREATOR_TOKENS,
        LIQUIDITY_TOKENS,
        PLATFORM_TOKENS,
        FUNDING_GOAL,
        ctx,
    );

    // Verify factory state updated
    assert!(factory::get_launchpad_count(&factory) == 1, 0);
    assert!(vector::length(factory::get_all_launchpads(&factory)) == 1, 1);
    assert!(factory::has_launchpads(&factory, CREATOR), 2);

    let creator_launchpads = factory::get_launchpads_by_creator(&factory, CREATOR);
    assert!(vector::length(creator_launchpads) == 1, 3);

    ts::return_shared(factory);

    destroy(metadata);
    ts::end(scenario);
}

#[test]
fun test_create_multiple_launchpads() {
    let mut scenario = ts::begin(CREATOR);
    let ctx = ts::ctx(&mut scenario);
    // Create factory
    setup(ctx);

    // Create first launchpad
    {
        // Create test coin metadata
        ts::next_tx(&mut scenario, CREATOR);
        let treasury_cap1 = scenario.take_from_sender<TreasuryCap<TESTTOKEN>>();
        let metadata1 = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

        let mut factory = ts::take_shared<LaunchpadFactory>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        factory::create_launchpad<TESTTOKEN>(
            &mut factory,
            treasury_cap1,
            &metadata1,
            TOTAL_SUPPLY,
            FUNDING_TOKENS,
            CREATOR_TOKENS,
            LIQUIDITY_TOKENS,
            PLATFORM_TOKENS,
            FUNDING_GOAL,
            ctx,
        );

        ts::return_shared(factory);
        destroy(metadata1);
    };

    // Create second launchpad with different coin type
    {
        ts::next_tx(&mut scenario, CREATOR);
        let treasury_cap2 = scenario.take_from_sender<TreasuryCap<TESTUSDC>>();
        let metadata2 = scenario.take_from_sender<CoinMetadata<TESTUSDC>>();

        ts::next_tx(&mut scenario, CREATOR);
        let mut factory = ts::take_shared<LaunchpadFactory>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        factory::create_launchpad<TESTUSDC>(
            &mut factory,
            treasury_cap2,
            &metadata2,
            TOTAL_SUPPLY,
            FUNDING_TOKENS,
            CREATOR_TOKENS,
            LIQUIDITY_TOKENS,
            PLATFORM_TOKENS,
            FUNDING_GOAL,
            ctx,
        );

        // Verify factory state
        assert!(factory::get_launchpad_count(&factory) == 2, 0);
        assert!(vector::length(factory::get_all_launchpads(&factory)) == 2, 1);

        let creator_launchpads = factory::get_launchpads_by_creator(&factory, CREATOR);
        assert!(vector::length(creator_launchpads) == 2, 2);

        ts::return_shared(factory);
        destroy(metadata2);
    };

    ts::end(scenario);
}

#[test]
fun test_launchpads_by_different_creators() {
    let mut scenario = ts::begin(CREATOR);
    let ctx = ts::ctx(&mut scenario);
    // Create factory
    setup(ctx);

    // Creator creates launchpad
    {
        // Create test coin metadata
        ts::next_tx(&mut scenario, CREATOR);
        let treasury_cap1 = scenario.take_from_sender<TreasuryCap<TESTTOKEN>>();
        let metadata1 = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

        ts::next_tx(&mut scenario, CREATOR);
        let mut factory = ts::take_shared<LaunchpadFactory>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        factory::create_launchpad<TESTTOKEN>(
            &mut factory,
            treasury_cap1,
            &metadata1,
            TOTAL_SUPPLY,
            FUNDING_TOKENS,
            CREATOR_TOKENS,
            LIQUIDITY_TOKENS,
            PLATFORM_TOKENS,
            FUNDING_GOAL,
            ctx,
        );

        ts::return_shared(factory);
        destroy(metadata1);
    };

    // Other user creates launchpad
    {
        ts::next_tx(&mut scenario, CREATOR);
        let treasury_cap2 = scenario.take_from_sender<TreasuryCap<TESTUSDC>>();
        let metadata2 = scenario.take_from_sender<CoinMetadata<TESTUSDC>>();

        ts::next_tx(&mut scenario, OTHER_USER);
        let mut factory = ts::take_shared<LaunchpadFactory>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        factory::create_launchpad<TESTUSDC>(
            &mut factory,
            treasury_cap2,
            &metadata2,
            TOTAL_SUPPLY,
            FUNDING_TOKENS,
            CREATOR_TOKENS,
            LIQUIDITY_TOKENS,
            PLATFORM_TOKENS,
            FUNDING_GOAL,
            ctx,
        );

        // Verify both creators have launchpads
        assert!(factory::get_launchpad_count(&factory) == 2, 0);
        assert!(factory::has_launchpads(&factory, CREATOR), 1);
        assert!(factory::has_launchpads(&factory, OTHER_USER), 2);

        let creator_launchpads = factory::get_launchpads_by_creator(&factory, CREATOR);
        let other_launchpads = factory::get_launchpads_by_creator(&factory, OTHER_USER);

        assert!(vector::length(creator_launchpads) == 1, 3);
        assert!(vector::length(other_launchpads) == 1, 4);

        ts::return_shared(factory);
        destroy(metadata2);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = bond_craft::factory::EInvalidSupply)]
fun test_create_launchpad_invalid_supply() {
    let mut scenario = ts::begin(CREATOR);
    let ctx = ts::ctx(&mut scenario);

    // Create factory
    setup(ctx);

    ts::next_tx(&mut scenario, CREATOR);
    let treasury_cap = scenario.take_from_sender<TreasuryCap<TESTTOKEN>>();
    let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

    // Try to create launchpad with invalid token allocation
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut factory = ts::take_shared<LaunchpadFactory>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        // Invalid: tokens don't add up to total supply
        factory::create_launchpad<TESTTOKEN>(
            &mut factory,
            treasury_cap,
            &metadata,
            TOTAL_SUPPLY,
            FUNDING_TOKENS,
            CREATOR_TOKENS,
            LIQUIDITY_TOKENS,
            PLATFORM_TOKENS + 1, // Invalid: makes total > TOTAL_SUPPLY
            FUNDING_GOAL,
            ctx,
        );

        ts::return_shared(factory);
    };

    destroy(metadata);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = bond_craft::factory::ENotFound)]
fun test_get_launchpads_by_nonexistent_creator() {
    let mut scenario = ts::begin(CREATOR);
    let ctx = ts::ctx(&mut scenario);

    // Create factory
    setup(ctx);

    // Try to get launchpads for creator who hasn't created any
    ts::next_tx(&mut scenario, CREATOR);
    {
        let factory = ts::take_shared<LaunchpadFactory>(&scenario);

        // This should fail because OTHER_USER hasn't created any launchpads
        let _launchpads = factory::get_launchpads_by_creator(&factory, OTHER_USER);

        ts::return_shared(factory);
    };

    ts::end(scenario);
}

#[test]
fun test_has_launchpads_function() {
    let mut scenario = ts::begin(CREATOR);
    let ctx = ts::ctx(&mut scenario);

    // Create factory
    setup(ctx);

    // Initially no one has launchpads
    ts::next_tx(&mut scenario, CREATOR);
    {
        let factory = ts::take_shared<LaunchpadFactory>(&scenario);

        assert!(!factory::has_launchpads(&factory, CREATOR), 0);
        assert!(!factory::has_launchpads(&factory, OTHER_USER), 1);

        ts::return_shared(factory);
    };

    // Create a launchpad
    {
        ts::next_tx(&mut scenario, CREATOR);
        let treasury_cap = scenario.take_from_sender<TreasuryCap<TESTTOKEN>>();
        let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

        ts::next_tx(&mut scenario, CREATOR);
        let mut factory = ts::take_shared<LaunchpadFactory>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        factory::create_launchpad<TESTTOKEN>(
            &mut factory,
            treasury_cap,
            &metadata,
            TOTAL_SUPPLY,
            FUNDING_TOKENS,
            CREATOR_TOKENS,
            LIQUIDITY_TOKENS,
            PLATFORM_TOKENS,
            FUNDING_GOAL,
            ctx,
        );

        // Now creator should have launchpads, but other user shouldn't
        assert!(factory::has_launchpads(&factory, CREATOR), 2);
        assert!(!factory::has_launchpads(&factory, OTHER_USER), 3);

        ts::return_shared(factory);
        destroy(metadata);
    };

    ts::end(scenario);
}

#[test]
fun test_getter_functions() {
    let mut scenario = ts::begin(CREATOR);
    let ctx = ts::ctx(&mut scenario);

    // Create factory
    setup(ctx);

    // Test initial state
    ts::next_tx(&mut scenario, CREATOR);
    {
        let factory = ts::take_shared<LaunchpadFactory>(&scenario);

        assert!(factory::get_launchpad_count(&factory) == 0, 0);
        assert!(vector::is_empty(factory::get_all_launchpads(&factory)), 1);

        ts::return_shared(factory);
    };

    // Create some launchpads and test updated state
    let num_launchpads = 3;
    let mut i = 0;

    while (i < num_launchpads) {
        ts::next_tx(&mut scenario, CREATOR);
        let treasury_cap = scenario.take_from_sender<TreasuryCap<TESTTOKEN>>();
        let metadata = scenario.take_from_sender<CoinMetadata<TESTTOKEN>>();

        ts::next_tx(&mut scenario, CREATOR);
        let mut factory = ts::take_shared<LaunchpadFactory>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        factory::create_launchpad<TESTTOKEN>(
            &mut factory,
            treasury_cap,
            &metadata,
            TOTAL_SUPPLY,
            FUNDING_TOKENS,
            CREATOR_TOKENS,
            LIQUIDITY_TOKENS,
            PLATFORM_TOKENS,
            FUNDING_GOAL,
            ctx,
        );

        // Verify count increases
        assert!(factory::get_launchpad_count(&factory) == i + 1, 2);
        assert!(vector::length(factory::get_all_launchpads(&factory)) == i + 1, 3);

        ts::return_shared(factory);
        destroy(metadata);

        i = i + 1;
    };

    // Final verification
    ts::next_tx(&mut scenario, CREATOR);
    {
        let factory = ts::take_shared<LaunchpadFactory>(&scenario);

        assert!(factory::get_launchpad_count(&factory) == num_launchpads, 4);
        assert!(vector::length(factory::get_all_launchpads(&factory)) == num_launchpads, 5);

        let creator_launchpads = factory::get_launchpads_by_creator(&factory, CREATOR);
        assert!(vector::length(creator_launchpads) == num_launchpads, 6);

        ts::return_shared(factory);
    };

    ts::end(scenario);
}

#[test]
fun test_helper_functions() {
    let mut scenario = ts::begin(CREATOR);
    let ctx = ts::ctx(&mut scenario);

    // Create factory
    setup(ctx);

    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut factory = ts::take_shared<LaunchpadFactory>(&scenario);

        // Test helper functions directly
        let dummy_id = object::id_from_address(@0x1);

        // Test add_launchpad_to_creator
        factory::add_launchpad_to_creator(&mut factory, CREATOR, dummy_id);
        assert!(factory::has_launchpads(&factory, CREATOR), 0);

        // Test add_to_all_launchpads
        factory::add_to_all_launchpads(&mut factory, dummy_id);
        assert!(vector::length(factory::get_all_launchpads(&factory)) == 1, 1);

        // Test increment_launchpad_count
        let initial_count = factory::get_launchpad_count(&factory);
        factory::increment_launchpad_count(&mut factory);
        assert!(factory::get_launchpad_count(&factory) == initial_count + 1, 2);

        ts::return_shared(factory);
    };

    ts::end(scenario);
}
