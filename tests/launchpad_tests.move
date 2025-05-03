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

}