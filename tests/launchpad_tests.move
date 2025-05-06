module bond_craft::launchpad_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin};
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};
    use std::option;

    use bond_craft::launchpad::{Self, Launchpad, LaunchpadWitness};
    use bond_craft::pool;
    use usdc::usdc::USDC;


    // Mock Cetus types for testing bootstrap_liquidity
    public struct GlobalConfig has key, store {
        id: UID,
    }

    public struct Pools has key, store {
        id: UID,
    }

    #[allow(unused_type_parameter)]
    public struct CoinMetadata<T> has key, store {
        id: UID,
        decimals: u8,
        name: String,
        symbol: String,
        description: String,
        icon_url: option::Option<String>,
    }

    // Helper function to set up a scenario
    fun setup_scenario(): Scenario {
        test_scenario::begin(@0x1)
    }

    // Helper to create mock USDC for testing
    fun create_mock_usdc(scenario: &mut Scenario, amount: u64, recipient: address) {
        test_scenario::next_tx(scenario, recipient);
        let ctx = test_scenario::ctx(scenario);

        let usdc = coin::mint_for_testing<USDC>(amount, ctx);
        transfer::public_transfer(usdc, recipient);
    }

    // Helper to create a mock clock
    fun create_mock_clock(scenario: &mut Scenario, timestamp_ms: u64): Clock {
        test_scenario::next_tx(scenario, @0x1);
        let ctx = test_scenario::ctx(scenario);

        let mut clock = clock::create_for_testing(ctx);
        clock::set_for_testing(&mut clock, timestamp_ms);
        clock
    }

    // Helper to create mock Cetus GlobalConfig
    fun create_mock_global_config(scenario: &mut Scenario): GlobalConfig {
        test_scenario::next_tx(scenario, @0x1);
        let ctx = test_scenario::ctx(scenario);

        GlobalConfig { id: object::new(ctx) }
    }

    // Helper to create mock Cetus Pools
    fun create_mock_pools(scenario: &mut Scenario): Pools {
        test_scenario::next_tx(scenario, @0x1);
        let ctx = test_scenario::ctx(scenario);

        Pools { id: object::new(ctx) }
    }

    // Helper to create mock CoinMetadata
    fun create_mock_coin_metadata<T>(scenario: &mut Scenario, decimals: u8): CoinMetadata<T> {
        test_scenario::next_tx(scenario, @0x1);
        let ctx = test_scenario::ctx(scenario);

        CoinMetadata<T> {
            id: object::new(ctx),
            decimals,
            name: string::utf8(b"Mock Token"),
            symbol: string::utf8(b"MOCK"),
            description: string::utf8(b"Mock metadata"),
            icon_url: option::none(),
        }
    }

    // Helper to set up a test launchpad
    fun setup_test_launchpad(scenario: &mut Scenario, creator: address): Launchpad {
        test_scenario::next_tx(scenario, creator);
        let ctx = test_scenario::ctx(scenario);
        
        // Setup launchpad params
        let total_supply = 10_000_000_000; // 10B tokens
        let funding_tokens = 5_000_000_000; // 50% for funding
        let creator_tokens = 2_000_000_000; // 20% for creator
        let liquidity_tokens = 2_000_000_000; // 20% for liquidity
        let platform_tokens = 1_000_000_000; // 10% for platform
        let funding_goal = 5_000_000; // 5M USDC (6 decimals)
        let platform_admin = creator;

        let launchpad = launchpad::create_test(
            ctx,
            b"TEST",
            b"Test Token",
            9,
            total_supply,
            funding_tokens,
            creator_tokens,
            liquidity_tokens,
            platform_tokens,
            funding_goal,
            platform_admin
        );
        
        launchpad
    }


    // Test: Create a launchpad
    #[test]
    fun test_create_launchpad() {
        let mut scenario = setup_scenario();
        let creator = @0xA;
        
        // Create launchpad
        let launchpad = setup_test_launchpad(&mut scenario, creator);
        transfer::public_transfer(launchpad, creator);
        
        // Verify launchpad properties
        test_scenario::next_tx(&mut scenario, creator);
        {
            let launchpad = test_scenario::take_from_sender<Launchpad>(&scenario);
            
            assert!(launchpad::total_supply(&launchpad) == 10_000_000_000, 0);
            assert!(launchpad::funding_tokens(&launchpad) == 5_000_000_000, 1);
            assert!(launchpad::creator_tokens(&launchpad) == 2_000_000_000, 2);
            assert!(launchpad::liquidity_tokens(&launchpad) == 2_000_000_000, 3);
            assert!(launchpad::platform_tokens(&launchpad) == 1_000_000_000, 4);
            assert!(launchpad::funding_goal(&launchpad) == 5_000_000, 5);
            assert!(launchpad::phase(&launchpad) == 0, 6); // PHASE_OPEN
            assert!(launchpad::tokens_sold(&launchpad) == 0, 7);
            assert!(launchpad::creator(&launchpad) == creator, 8);
            assert!(launchpad::platform_admin(&launchpad) == creator, 9);
            
            test_scenario::return_to_sender(&scenario, launchpad);
        };
        
        test_scenario::end(scenario);
    }


    // Test: Buy tokens from launchpad
    #[test]
    fun test_buy_tokens() {
        let mut scenario = setup_scenario();
        let creator = @0xA;
        let buyer = @0xB;
        
        // Create launchpad
        let launchpad = setup_test_launchpad(&mut scenario, creator);
        transfer::public_transfer(launchpad, creator);
        
        // Create mock USDC for buyer
        create_mock_usdc(&mut scenario, 10_000_000_000, buyer); // 10B USDC
        
        // Buy tokens
        test_scenario::next_tx(&mut scenario, buyer);
        {
            let mut launchpad = test_scenario::take_from_address<Launchpad>(&scenario, creator);
            let usdc = test_scenario::take_from_sender<Coin<USDC>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            // Initial state check
            assert!(launchpad::tokens_sold(&launchpad) == 0, 0);
            
            // Buy 1M tokens
            let amount_to_buy = 1_000_000_000;
            launchpad::buy_tokens(&mut launchpad, usdc, amount_to_buy, ctx);
            
            // Verify state after purchase
            assert!(launchpad::tokens_sold(&launchpad) == amount_to_buy, 1);
            
            test_scenario::return_to_address( creator, launchpad);
        };
        
        // Verify buyer received tokens
        test_scenario::next_tx(&mut scenario, buyer);
        {
            assert!(test_scenario::has_most_recent_for_sender<Coin<LaunchpadWitness>>(&scenario), 2);
            let tokens = test_scenario::take_from_sender<Coin<LaunchpadWitness>>(&scenario);
            assert!(coin::value(&tokens) == 1_000_000_000, 3);
            
            test_scenario::return_to_sender(&scenario, tokens);
        };
        
        test_scenario::end(scenario);
    }


    // Test: Close funding phase
    #[test]
    fun test_close_funding() {
        let mut scenario = setup_scenario();
        let creator = @0xA;
        
        // Create launchpad
        let launchpad = setup_test_launchpad(&mut scenario, creator);
        transfer::public_transfer(launchpad, creator);

        // Advance epoch to ensure vesting_start_epoch > 0
        test_scenario::next_epoch(&mut scenario, creator);
        
        // Close funding
        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut launchpad = test_scenario::take_from_sender<Launchpad>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            // Before closing
            assert!(launchpad::phase(&launchpad) == 0, 0); // PHASE_OPEN
            
            // Close funding
            launchpad::close_funding(&mut launchpad, ctx);
            
            // After closing
            assert!(launchpad::phase(&launchpad) == 1, 1); // PHASE_CLOSED
            assert!(launchpad::vesting_start_epoch(&launchpad) > 0, 2);
            
            test_scenario::return_to_sender(&scenario, launchpad);
        };
        
        test_scenario::end(scenario);
    }

}