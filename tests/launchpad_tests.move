module bond_craft::launchpad_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin};

    use bond_craft::launchpad::{Self, Launchpad};
    use usdc::usdc::USDC;

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
        let funding_goal = 5_000_000_000_000; // 5M USDC (6 decimals)
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
            assert!(launchpad::funding_goal(&launchpad) == 5_000_000_000_000, 5);
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

    // Test: Claim creator tokens
    #[test]
    fun test_claim_creator_tokens() {
        let mut scenario = setup_scenario();
        let creator = @0xA;
        
        // Create launchpad
        let launchpad = setup_test_launchpad(&mut scenario, creator);
        transfer::public_transfer(launchpad, creator);
        
        // Advance epoch to ensure vesting_start_epoch > 0
        test_scenario::next_epoch(&mut scenario, creator);
        
        // Close funding first
        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut launchpad = test_scenario::take_from_sender<Launchpad>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            launchpad::close_funding(&mut launchpad, ctx);
            test_scenario::return_to_sender(&scenario, launchpad);
        };
        
        // Claim creator tokens
        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut launchpad = test_scenario::take_from_sender<Launchpad>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            // Before claiming
            assert!(launchpad::creator_tokens(&launchpad) == 2_000_000_000, 0);
            
            // Claim tokens
            launchpad::claim_creator_tokens(&mut launchpad, ctx);
            
            // After claiming
            assert!(launchpad::creator_tokens(&launchpad) == 0, 1);
            
            test_scenario::return_to_sender(&scenario, launchpad);
        };
        
        // Verify creator received tokens
        test_scenario::next_tx(&mut scenario, creator);
        {
            assert!(test_scenario::has_most_recent_for_sender<Coin<LaunchpadWitness>>(&scenario), 2);
            let tokens = test_scenario::take_from_sender<Coin<LaunchpadWitness>>(&scenario);
            assert!(coin::value(&tokens) == 2_000_000_000, 3);
            
            test_scenario::return_to_sender(&scenario, tokens);
        };
        
        test_scenario::end(scenario);
    }

    // Test: Claim platform tokens
    #[test]
    fun test_claim_platform_tokens() {
        let mut scenario = setup_scenario();
        let creator = @0xA;
        let platform_admin = @0xC;
        
        // Create launchpad
        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            
            let launchpad = launchpad::create_test(
                ctx,
                b"TEST",
                b"Test Token",
                9,
                10_000_000_000,
                5_000_000_000,
                2_000_000_000,
                2_000_000_000,
                1_000_000_000,
                5_000_000_000_000,
                platform_admin
            );
            transfer::public_transfer(launchpad, creator);
        };
        
        // Advance epoch to ensure vesting_start_epoch > 0
        test_scenario::next_epoch(&mut scenario, creator);
        
        // Close funding
        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut launchpad = test_scenario::take_from_sender<Launchpad>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            launchpad::close_funding(&mut launchpad, ctx);
            test_scenario::return_to_sender(&scenario, launchpad);
        };
        
        // Claim platform tokens
        test_scenario::next_tx(&mut scenario, platform_admin);
        {
            let mut launchpad = test_scenario::take_from_address<Launchpad>(&scenario, creator);
            let ctx = test_scenario::ctx(&mut scenario);
            
            // Before claiming
            assert!(launchpad::platform_tokens(&launchpad) == 1_000_000_000, 0);
            assert!(launchpad::platform_admin(&launchpad) == platform_admin, 1);
            
            // Claim tokens
            launchpad::claim_platform_tokens(&mut launchpad, ctx);
            
            // After claiming
            assert!(launchpad::platform_tokens(&launchpad) == 0, 2);
            
            test_scenario::return_to_address(creator, launchpad);
        };
        
        // Verify platform admin received tokens
        test_scenario::next_tx(&mut scenario, platform_admin);
        {
            assert!(test_scenario::has_most_recent_for_sender<Coin<LaunchpadWitness>>(&scenario), 3);
            let tokens = test_scenario::take_from_sender<Coin<LaunchpadWitness>>(&scenario);
            assert!(coin::value(&tokens) == 1_000_000_000, 4);
            
            test_scenario::return_to_sender(&scenario, tokens);
        };
        
        test_scenario::end(scenario);
    }

    // Test: Withdraw funding with multiple buyers
    #[test]
    fun test_withdraw_funding() {
        let mut scenario = setup_scenario();
        let creator = @0xA;
        let buyer1 = @0xB;
        let buyer2 = @0xC;
        let buyer3 = @0xD;
        
        // Create launchpad
        let launchpad = setup_test_launchpad(&mut scenario, creator);
        transfer::public_transfer(launchpad, creator);
        
        // Create mock USDC for buyers
        create_mock_usdc(&mut scenario, 10_000_000_000, buyer1); // 10B USDC
        create_mock_usdc(&mut scenario, 10_000_000_000, buyer2); // 10B USDC
        create_mock_usdc(&mut scenario, 10_000_000_000, buyer3); // 10B USDC
        
        // Buyer 1: Buy tokens
        test_scenario::next_tx(&mut scenario, buyer1);
        {
            let mut launchpad = test_scenario::take_from_address<Launchpad>(&scenario, creator);
            let usdc = test_scenario::take_from_sender<Coin<USDC>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            let amount_to_buy = 100_000; // 100K tokens
            launchpad::buy_tokens(&mut launchpad, usdc, amount_to_buy, ctx);
            let funding_balance = launchpad::funding_balance(&launchpad);
            assert!(funding_balance > 0, 0);
            assert!(launchpad::phase(&launchpad) == 0, 100); // Ensure PHASE_OPEN
            
            test_scenario::return_to_address(creator, launchpad);
        };
        
        // Buyer 2: Buy tokens
        test_scenario::next_tx(&mut scenario, buyer2);
        {
            let mut launchpad = test_scenario::take_from_address<Launchpad>(&scenario, creator);
            let usdc = test_scenario::take_from_sender<Coin<USDC>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            let amount_to_buy = 100_000; // 100K tokens
            launchpad::buy_tokens(&mut launchpad, usdc, amount_to_buy, ctx);
            let funding_balance = launchpad::funding_balance(&launchpad);
            assert!(funding_balance > 0, 1);
            assert!(launchpad::phase(&launchpad) == 0, 101); // Ensure PHASE_OPEN
            
            test_scenario::return_to_address(creator, launchpad);
        };
        
        // Buyer 3: Buy tokens
        test_scenario::next_tx(&mut scenario, buyer3);
        {
            let mut launchpad = test_scenario::take_from_address<Launchpad>(&scenario, creator);
            let usdc = test_scenario::take_from_sender<Coin<USDC>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            let amount_to_buy = 100_000; // 100K tokens
            launchpad::buy_tokens(&mut launchpad, usdc, amount_to_buy, ctx);
            let funding_balance = launchpad::funding_balance(&launchpad);
            assert!(funding_balance > 0, 2);
            assert!(launchpad::phase(&launchpad) == 0, 102); // Ensure PHASE_OPEN
            
            test_scenario::return_to_address(creator, launchpad);
        };
        
        // Advance epoch to ensure vesting_start_epoch > 0
        test_scenario::next_epoch(&mut scenario, creator);
        
        // Close funding
        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut launchpad = test_scenario::take_from_sender<Launchpad>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            assert!(launchpad::phase(&launchpad) == 0, 103); // Ensure PHASE_OPEN
            launchpad::close_funding(&mut launchpad, ctx);
            assert!(launchpad::phase(&launchpad) == 1, 104); // Ensure PHASE_CLOSED
            test_scenario::return_to_sender(&scenario, launchpad);
        };
        
        // Withdraw funding
        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut launchpad = test_scenario::take_from_sender<Launchpad>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            let funding_balance = launchpad::funding_balance(&launchpad);
            assert!(funding_balance > 0, 3);
            
            launchpad::withdraw_funding(&mut launchpad, funding_balance, ctx);
            
            assert!(launchpad::funding_balance(&launchpad) == 0, 4);
            
            test_scenario::return_to_sender(&scenario, launchpad);
        };
        
        // Verify creator received USDC
        test_scenario::next_tx(&mut scenario, creator);
        {
            assert!(test_scenario::has_most_recent_for_sender<Coin<USDC>>(&scenario), 5);
            let usdc = test_scenario::take_from_sender<Coin<USDC>>(&scenario);
            assert!(coin::value(&usdc) > 0, 6);
            
            test_scenario::return_to_sender(&scenario, usdc);
        };
        
        test_scenario::end(scenario);
    }


    // Test: Bootstrap liquidity
    #[test]
    fun test_bootstrap_liquidity() {
        let mut scenario = setup_scenario();
        let creator = @0xA;
        let buyer = @0xB;
        
        // Create launchpad
        let launchpad = setup_test_launchpad(&mut scenario, creator);
        transfer::public_transfer(launchpad, creator);
        
        // Create mock USDC for buyer
        create_mock_usdc(&mut scenario, 10_000_000_000, buyer); // 10B USDC
        
        // Buy tokens to add funding
        test_scenario::next_tx(&mut scenario, buyer);
        {
            let mut launchpad = test_scenario::take_from_address<Launchpad>(&scenario, creator);
            let usdc = test_scenario::take_from_sender<Coin<USDC>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            // Buy 1M tokens
            let amount_to_buy = 1_000_000_000;
            launchpad::buy_tokens(&mut launchpad, usdc, amount_to_buy, ctx);
            let funding_balance = launchpad::funding_balance(&launchpad);
            assert!(funding_balance > 0, 0);
            assert!(launchpad::phase(&launchpad) == 0, 100); // Ensure still PHASE_OPEN
            
            test_scenario::return_to_address(creator, launchpad);
        };
        
        // Advance epoch to ensure vesting_start_epoch > 0
        test_scenario::next_epoch(&mut scenario, creator);
        
        // Close funding
        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut launchpad = test_scenario::take_from_sender<Launchpad>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            launchpad::close_funding(&mut launchpad, ctx);
            assert!(launchpad::phase(&launchpad) == 1, 1); // PHASE_CLOSED
            
            test_scenario::return_to_sender(&scenario, launchpad);
        };
        
        
        // Bootstrap liquidity
        test_scenario::next_tx(&mut scenario, creator);
        {
           let mut launchpad = test_scenario::take_from_sender<Launchpad>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
    
            // Before bootstrapping
            assert!(launchpad::phase(&launchpad) == 1, 2); // PHASE_CLOSED
            assert!(launchpad::funding_balance(&launchpad) > 0, 3);
            assert!(launchpad::liquidity_tokens(&launchpad) == 2_000_000_000, 4);
    
            // Mock pool creation
            launchpad::bootstrap_liquidity_test(&mut launchpad, ctx);
    
            // After bootstrapping
            assert!(launchpad::phase(&launchpad) == 2, 5); // PHASE_LIQUIDITY_BOOTSTRAPPED
            assert!(launchpad::funding_balance(&launchpad) == 0, 6); // Funding tokens transferred
            
            test_scenario::return_to_sender(&scenario, launchpad);
        };
        
        test_scenario::end(scenario);
    }


}