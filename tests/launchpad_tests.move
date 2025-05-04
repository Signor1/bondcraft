// module bond_craft::launchpad_tests {
//     use sui::test_scenario::{Self, Scenario};
//     use sui::coin::{Self, TreasuryCap, CoinMetadata};
//     use sui::clock::{Self, Clock};

//     use bond_craft::launchpad::{Self, Launchpad};
//     use bond_craft::bonding_curve;
//     use usdc::usdc::USDC;

//     // For tests, we create a custom token
//     public struct TEST_TOKEN has drop {}
    
//     // Helper function to set up a scenario
//     fun setup_scenario(): Scenario {
//         test_scenario::begin(@0x1)
//     }

//     // Helper to create mock USDC for testing
//     fun create_mock_usdc(scenario: &mut Scenario, amount: u64, recipient: address) {
//         test_scenario::next_tx(scenario, recipient);
//         let ctx = test_scenario::ctx(scenario);
//         let usdc = coin::mint_for_testing<USDC>(amount, ctx);
//         transfer::public_transfer(usdc, recipient);
//     }

//     // Helper to set up a test launchpad
//     fun setup_test_launchpad(scenario: &mut Scenario, creator: address): Launchpad<TEST_TOKEN> {
//         test_scenario::next_tx(scenario, creator);
//         let ctx = test_scenario::ctx(scenario);
        
//         // Mock coin metadata for tests
//         let (treasury_cap, metadata) = coin::create_currency_for_testing<TEST_TOKEN>(
//             ctx,
//             9, // decimals
//             b"TEST", 
//             b"Test Token",
//             b"Test Token Description",
//             option::none(), // icon URL
//         );
        
//         // Make metadata accessible
//         transfer::public_freeze_object(metadata);
        
//         // Setup launchpad params
//         let total_supply = 10_000_000_000; // 10B tokens
//         let funding_tokens = 5_000_000_000; // 50% for funding
//         let creator_tokens = 2_000_000_000; // 20% for creator
//         let liquidity_tokens = 2_000_000_000; // 20% for liquidity
//         let platform_tokens = 1_000_000_000; // 10% for platform
//         let funding_goal = 5_000_000; // 5M USDC (assuming 6 decimals)
//         let platform_admin = creator; // For simplicity, using creator as platform admin
        
//         // Create test launchpad
//         let launchpad = launchpad::create<TEST_TOKEN>(
//             TEST_TOKEN {},
//             b"TEST",
//             b"Test Token",
//             9, // decimals
//             total_supply,
//             funding_tokens,
//             creator_tokens,
//             liquidity_tokens,
//             platform_tokens,
//             funding_goal,
//             platform_admin,
//             ctx
//         );
        
//         launchpad
//     }

//     // Test: Create a launchpad
//     #[test]
//     fun test_create_launchpad() {
//         let scenario = setup_scenario();
//         let creator = @0xA;
        
//         // Create launchpad
//         test_scenario::next_tx(&mut scenario, creator);
//         {
//             let ctx = test_scenario::ctx(&mut scenario);
            
//             // Setup launchpad params
//             let total_supply = 10_000_000_000; // 10B tokens
//             let funding_tokens = 5_000_000_000; // 50% for funding
//             let creator_tokens = 2_000_000_000; // 20% for creator
//             let liquidity_tokens = 2_000_000_000; // 20% for liquidity
//             let platform_tokens = 1_000_000_000; // 10% for platform
//             let funding_goal = 5_000_000; // 5M USDC
//             let platform_admin = creator; // For simplicity
            
//             let launchpad = launchpad::create<TEST_TOKEN>(
//                 TEST_TOKEN {},
//                 b"TEST",
//                 b"Test Token",
//                 9, // decimals
//                 total_supply,
//                 funding_tokens,
//                 creator_tokens,
//                 liquidity_tokens,
//                 platform_tokens,
//                 funding_goal,
//                 platform_admin,
//                 ctx
//             );
            
//             // Transfer to sender to test ownership
//             transfer::public_transfer(launchpad, creator);
//         };
        
//         // Verify launchpad properties
//         test_scenario::next_tx(&mut scenario, creator);
//         {
//             let launchpad = test_scenario::take_from_sender<Launchpad<TEST_TOKEN>>(&scenario);
            
//             // Verify launchpad properties
//             assert!(launchpad::total_supply(&launchpad) == 10_000_000_000, 0);
//             assert!(launchpad::funding_tokens(&launchpad) == 5_000_000_000, 1);
//             assert!(launchpad::creator_tokens(&launchpad) == 2_000_000_000, 2);
//             assert!(launchpad::liquidity_tokens(&launchpad) == 2_000_000_000, 3);
//             assert!(launchpad::platform_tokens(&launchpad) == 1_000_000_000, 4);
//             assert!(launchpad::funding_goal(&launchpad) == 5_000_000, 5);
//             assert!(launchpad::phase(&launchpad) == 0, 6); // PHASE_OPEN
//             assert!(launchpad::tokens_sold(&launchpad) == 0, 7);
//             assert!(launchpad::creator(&launchpad) == creator, 8);
//             assert!(launchpad::platform_admin(&launchpad) == creator, 9);
            
//             // Return launchpad to sender
//             test_scenario::return_to_sender(&scenario, launchpad);
//         };
        
//         test_scenario::end(scenario);
//     }

//     // Test: Buy tokens from launchpad
//     #[test]
//     fun test_buy_tokens() {
//         let scenario = setup_scenario();
//         let creator = @0xA;
//         let buyer = @0xB;
        
//         // Create launchpad
//         let launchpad = setup_test_launchpad(&mut scenario, creator);
//         transfer::public_transfer(launchpad, creator);
        
//         // Create mock USDC for buyer
//         create_mock_usdc(&mut scenario, 10_000_000, buyer); // 10M USDC
        
//         // Buy tokens
//         test_scenario::next_tx(&mut scenario, buyer);
//         {
//             let launchpad = test_scenario::take_from_address<Launchpad<TEST_TOKEN>>(&scenario, creator);
//             let usdc = test_scenario::take_from_sender<coin::Coin<USDC>>(&scenario);
//             let ctx = test_scenario::ctx(&mut scenario);
            
//             // Initial state check
//             assert!(launchpad::tokens_sold(&launchpad) == 0, 0);
            
//             // Buy 1M tokens
//             let amount_to_buy = 1_000_000_000;
//             launchpad::buy_tokens(&mut launchpad, usdc, amount_to_buy, ctx);
            
//             // Verify state after purchase
//             assert!(launchpad::tokens_sold(&launchpad) == amount_to_buy, 1);
            
//             // Return launchpad to creator
//             test_scenario::return_to_address(&scenario, creator, launchpad);
//         };
        
//         // Verify buyer received tokens
//         test_scenario::next_tx(&mut scenario, buyer);
//         {
//             // Check if buyer has TEST_TOKEN coins
//             assert!(test_scenario::has_most_recent_for_sender<coin::Coin<TEST_TOKEN>>(&scenario), 2);
//             let tokens = test_scenario::take_from_sender<coin::Coin<TEST_TOKEN>>(&scenario);
//             assert!(coin::value(&tokens) == 1_000_000_000, 3);
            
//             // Return tokens to buyer
//             test_scenario::return_to_sender(&scenario, tokens);
//         };
        
//         test_scenario::end(scenario);
//     }

//     // Test: Close funding phase
//     #[test]
//     fun test_close_funding() {
//         let scenario = setup_scenario();
//         let creator = @0xA;
        
//         // Create launchpad
//         let launchpad = setup_test_launchpad(&mut scenario, creator);
//         transfer::public_transfer(launchpad, creator);
        
//         // Close funding
//         test_scenario::next_tx(&mut scenario, creator);
//         {
//             let launchpad = test_scenario::take_from_sender<Launchpad<TEST_TOKEN>>(&scenario);
//             let ctx = test_scenario::ctx(&mut scenario);
            
//             // Before closing
//             assert!(launchpad::phase(&launchpad) == 0, 0); // PHASE_OPEN
            
//             // Close funding
//             launchpad::close_funding(&mut launchpad, ctx);
            
//             // After closing
//             assert!(launchpad::phase(&launchpad) == 1, 1); // PHASE_CLOSED
//             assert!(launchpad::vesting_start_epoch(&launchpad) > 0, 2);
            
//             // Return launchpad to creator
//             test_scenario::return_to_sender(&scenario, launchpad);
//         };
        
//         test_scenario::end(scenario);
//     }

//     // Test: Claim creator tokens
//     #[test]
//     fun test_claim_creator_tokens() {
//         let scenario = setup_scenario();
//         let creator = @0xA;
        
//         // Create launchpad
//         let launchpad = setup_test_launchpad(&mut scenario, creator);
//         transfer::public_transfer(launchpad, creator);
        
//         // Close funding first
//         test_scenario::next_tx(&mut scenario, creator);
//         {
//             let launchpad = test_scenario::take_from_sender<Launchpad<TEST_TOKEN>>(&scenario);
//             let ctx = test_scenario::ctx(&mut scenario);
            
//             launchpad::close_funding(&mut launchpad, ctx);
//             test_scenario::return_to_sender(&scenario, launchpad);
//         };
        
//         // Claim creator tokens
//         test_scenario::next_tx(&mut scenario, creator);
//         {
//             let launchpad = test_scenario::take_from_sender<Launchpad<TEST_TOKEN>>(&scenario);
//             let ctx = test_scenario::ctx(&mut scenario);
            
//             // Before claiming
//             assert!(launchpad::creator_tokens(&launchpad) == 2_000_000_000, 0);
            
//             // Claim tokens
//             launchpad::claim_creator_tokens(&mut launchpad, ctx);
            
//             // After claiming
//             assert!(launchpad::creator_tokens(&launchpad) == 0, 1);
            
//             test_scenario::return_to_sender(&scenario, launchpad);
//         };
        
//         // Verify creator received tokens
//         test_scenario::next_tx(&mut scenario, creator);
//         {
//             assert!(test_scenario::has_most_recent_for_sender<coin::Coin<TEST_TOKEN>>(&scenario), 2);
//             let tokens = test_scenario::take_from_sender<coin::Coin<TEST_TOKEN>>(&scenario);
//             assert!(coin::value(&tokens) == 2_000_000_000, 3);
            
//             test_scenario::return_to_sender(&scenario, tokens);
//         };
        
//         test_scenario::end(scenario);
//     }

//     // Test: Claim platform tokens
//     #[test]
//     fun test_claim_platform_tokens() {
//         let scenario = setup_scenario();
//         let creator = @0xA;
//         let platform_admin = @0xC; // Different address for testing
        
//         // Create launchpad with different platform admin
//         test_scenario::next_tx(&mut scenario, creator);
//         {
//             let ctx = test_scenario::ctx(&mut scenario);
            
//             // Setup launchpad params
//             let total_supply = 10_000_000_000; // 10B tokens
//             let funding_tokens = 5_000_000_000; // 50% for funding
//             let creator_tokens = 2_000_000_000; // 20% for creator
//             let liquidity_tokens = 2_000_000_000; // 20% for liquidity
//             let platform_tokens = 1_000_000_000; // 10% for platform
//             let funding_goal = 5_000_000; // 5M USDC
            
//             let launchpad = launchpad::create<TEST_TOKEN>(
//                 TEST_TOKEN {},
//                 b"TEST",
//                 b"Test Token",
//                 9, // decimals
//                 total_supply,
//                 funding_tokens,
//                 creator_tokens,
//                 liquidity_tokens,
//                 platform_tokens,
//                 funding_goal,
//                 platform_admin, // Different platform admin
//                 ctx
//             );
            
//             transfer::public_transfer(launchpad, creator);
//         };
        
//         // Close funding first
//         test_scenario::next_tx(&mut scenario, creator);
//         {
//             let launchpad = test_scenario::take_from_sender<Launchpad<TEST_TOKEN>>(&scenario);
//             let ctx = test_scenario::ctx(&mut scenario);
            
//             launchpad::close_funding(&mut launchpad, ctx);
//             test_scenario::return_to_sender(&scenario, launchpad);
//         };
        
//         // Claim platform tokens (as platform admin)
//         test_scenario::next_tx(&mut scenario, platform_admin);
//         {
//             let launchpad = test_scenario::take_from_address<Launchpad<TEST_TOKEN>>(&scenario, creator);
//             let ctx = test_scenario::ctx(&mut scenario);
            
//             // Before claiming
//             assert!(launchpad::platform_tokens(&launchpad) == 1_000_000_000, 0);
//             assert!(launchpad::platform_admin(&launchpad) == platform_admin, 1);
            
//             // Claim tokens
//             launchpad::claim_platform_tokens(&mut launchpad, ctx);
            
//             // After claiming
//             assert!(launchpad::platform_tokens(&launchpad) == 0, 2);
            
//             test_scenario::return_to_address(&scenario, creator, launchpad);
//         };
        
//         // Verify platform admin received tokens
//         test_scenario::next_tx(&mut scenario, platform_admin);
//         {
//             assert!(test_scenario::has_most_recent_for_sender<coin::Coin<TEST_TOKEN>>(&scenario), 3);
//             let tokens = test_scenario::take_from_sender<coin::Coin<TEST_TOKEN>>(&scenario);
//             assert!(coin::value(&tokens) == 1_000_000_000, 4);
            
//             test_scenario::return_to_sender(&scenario, tokens);
//         };
        
//         test_scenario::end(scenario);
//     }

//     // Test: Withdraw funding
//     #[test]
//     fun test_withdraw_funding() {
//         let scenario = setup_scenario();
//         let creator = @0xA;
//         let buyer = @0xB;
        
//         // Create launchpad
//         let launchpad = setup_test_launchpad(&mut scenario, creator);
//         transfer::public_transfer(launchpad, creator);
        
//         // Create mock USDC for buyer
//         create_mock_usdc(&mut scenario, 10_000_000, buyer); // 10M USDC
        
//         // Buy tokens to add funding
//         test_scenario::next_tx(&mut scenario, buyer);
//         {
//             let launchpad = test_scenario::take_from_address<Launchpad<TEST_TOKEN>>(&scenario, creator);
//             let usdc = test_scenario::take_from_sender<coin::Coin<USDC>>(&scenario);
//             let ctx = test_scenario::ctx(&mut scenario);
            
//             // Buy 1M tokens
//             launchpad::buy_tokens(&mut launchpad, usdc, 1_000_000_000, ctx);
//             let funding_balance = launchpad::funding_balance(&launchpad);
//             assert!(funding_balance > 0, 0);
            
//             // Return launchpad to creator
//             test_scenario::return_to_address(&scenario, creator, launchpad);
//         };
        
//         // Close funding
//         test_scenario::next_tx(&mut scenario, creator);
//         {
//             let launchpad = test_scenario::take_from_sender<Launchpad<TEST_TOKEN>>(&scenario);
//             let ctx = test_scenario::ctx(&mut scenario);
            
//             launchpad::close_funding(&mut launchpad, ctx);
//             test_scenario::return_to_sender(&scenario, launchpad);
//         };
        
//         // Withdraw funding
//         test_scenario::next_tx(&mut scenario, creator);
//         {
//             let launchpad = test_scenario::take_from_sender<Launchpad<TEST_TOKEN>>(&scenario);
//             let ctx = test_scenario::ctx(&mut scenario);
            
//             // Get current funding balance
//             let funding_balance = launchpad::funding_balance(&launchpad);
//             assert!(funding_balance > 0, 1);
            
//             // Withdraw all funding
//             launchpad::withdraw_funding(&mut launchpad, funding_balance, ctx);
            
//             // Verify funding balance is now zero
//             assert!(launchpad::funding_balance(&launchpad) == 0, 2);
            
//             test_scenario::return_to_sender(&scenario, launchpad);
//         };
        
//         // Verify creator received USDC
//         test_scenario::next_tx(&mut scenario, creator);
//         {
//             assert!(test_scenario::has_most_recent_for_sender<coin::Coin<USDC>>(&scenario), 3);
//             let usdc = test_scenario::take_from_sender<coin::Coin<USDC>>(&scenario);
//             assert!(coin::value(&usdc) > 0, 4);
            
//             test_scenario::return_to_sender(&scenario, usdc);
//         };
        
//         test_scenario::end(scenario);
//     }

//     // Note: We can't fully test bootstrap_liquidity as it depends on Cetus modules 
//     // which would require more extensive setup. We'll need a mock implementation for testing.
// }