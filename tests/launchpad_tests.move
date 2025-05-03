#[test_only]
module bond_craft::launchpad_tests{
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin, CoinMetadata, TreasuryCap};
    use sui::balance::{Self, Balance};
    use sui::tx_context::TxContext;
    use sui::transfer;
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};

    use bond_craft::launchpad::{Self, Launchpad, LaunchParams, LaunchState};
    use bond_craft::bonding_curve;
    use bond_craft::pool;
    use usdc::usdc::USDC;
    use cetus_clmm::config::GlobalConfig;
    use cetus_clmm::factory::Pools;
    use integer_mate::i32;

    // Test witness type
    public struct TEST_TOKEN has drop {}

    // Error codes from launchpad.move
    const EINVALID_ALLOCATION: u64 = 1;
    const EINVALID_NAME: u64 = 2;
    const EINVALID_SYMBOL: u64 = 3;
    const EINVALID_DECIMALS: u64 = 4;
    const EINVALID_FUNDING_GOAL: u64 = 5;
    const EINVALID_TOTAL_SUPPLY: u64 = 6;
    const EINSUFFICIENT_PAYMENT: u64 = 7;
    const EINVALID_PHASE: u64 = 8;
    const EUNAUTHORIZED: u64 = 9;
    const EINSUFFICIENT_TOKENS: u64 = 10;
    const EVESTING_NOT_READY: u64 = 11;

    // Helper function to set up a test scenario
    public fun setup_scenario(): Scenario {
        let scenario_val = test_scenario::begin(@0x1);
        scenario_val
    }

    // Helper function to create a mock USDC coin
    public fun create_mock_usdc(scenario: &mut Scenario, amount: u64, recipient: address) {
        test_scenario::next_tx(scenario, recipient);
        let ctx = test_scenario::ctx(scenario);
        let usdc = coin::mint_for_testing<USDC>(amount, ctx);
        transfer::public_transfer(usdc, recipient);
    }

    // Helper function to create mock metadata for TEST_TOKEN
    public fun create_mock_metadata(scenario: &mut Scenario, creator: address): CoinMetadata<TEST_TOKEN> {
        test_scenario::next_tx(scenario, creator);
        let ctx = test_scenario::ctx(scenario);
        let (treasury_t, metadata_t) = coin::create_currency<TEST_TOKEN>(
            TEST_TOKEN {},
            9,
            b"TEST",
            b"Test Token",
            b"Mock token",
            option::none(),
            ctx
        );
        transfer::public_freeze_object(metadata_t);
        transfer::public_transfer(treasury_t, creator);
        test_scenario::next_tx(scenario, creator);
        test_scenario::take_from_sender<CoinMetadata<TEST_TOKEN>>(scenario)
    }

    // Helper function to create a launchpad
    public fun create_test_launchpad(scenario: &mut Scenario, creator: address): Launchpad<TEST_TOKEN> {
        test_scenario::next_tx(scenario, creator);
        let ctx = test_scenario::ctx(scenario);
        let launchpad = launchpad::create<TEST_TOKEN>(
            TEST_TOKEN {},
            b"TEST",
            b"Test Token",
            9,
            1_000_000_000, // total_supply
            500_000_000,   // funding_tokens
            200_000_000,   // creator_tokens
            200_000_000,   // liquidity_tokens
            100_000_000,   // platform_tokens
            500_000_000,   // funding_goal (USDC, 6 decimals)
            creator,
            ctx
        );
        transfer::public_transfer(launchpad, creator);
        test_scenario::next_tx(scenario, creator);
        test_scenario::take_from_sender<Launchpad<TEST_TOKEN>>(scenario)
    }

}