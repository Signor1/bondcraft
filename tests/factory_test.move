// module bond_craft::factory_tests{
//     use sui::test_scenario::{Self, Scenario};
//     use sui::coin::{Self, TreasuryCap, CoinMetadata};
//     use std::string;
//     use std::ascii;

//     use bond_craft::factory::{Self, LaunchpadFactory};
//     use bond_craft::launchpad;
//     use usdc::usdc::USDC;

//     // For tests, we need a one-time witness
//     public struct TEST_TOKEN has drop {}

//     // Helper function to set up a scenario
//     fun setup_scenario(): Scenario {
//         test_scenario::begin(@0x1)
//     }

//     // Helper function to create a factory object
//     fun create_test_factory(scenario: &mut Scenario, creator: address): LaunchpadFactory {
//         test_scenario::next_tx(scenario, creator);
//         let ctx = test_scenario::ctx(scenario);
        
//         factory::create_factory(ctx);
        
//         test_scenario::next_tx(scenario, creator);
//         test_scenario::take_from_sender<LaunchpadFactory>(scenario)
//     }

//     // Helper to create mock USDC for testing
//     fun create_mock_usdc(scenario: &mut Scenario, amount: u64, recipient: address) {
//         test_scenario::next_tx(scenario, recipient);
//         let ctx = test_scenario::ctx(scenario);
//         let usdc = coin::mint_for_testing<USDC>(amount, ctx);
//         transfer::public_transfer(usdc, recipient);
//     }



//     // Test: Create a factory
//     #[test]
//     fun test_create_factory() {
//         let mut scenario = setup_scenario();
//         let creator = @0xA;
        
//         // Create factory
//         test_scenario::next_tx(&mut scenario, creator);
//         {
//             let ctx = test_scenario::ctx(&mut scenario);
//             factory::create_factory(ctx);
//         };
        
//         // Verify factory is created
//         test_scenario::next_tx(&mut scenario, creator);
//         {
//             let factory = test_scenario::take_from_sender<LaunchpadFactory>(&scenario);
            
//             // Verify factory properties
//             assert!(factory::get_launchpad_count(&factory) == 0, 0);
//             assert!(vector::length(factory::get_all_launchpads(&factory)) == 0, 1);
            
//             test_scenario::return_to_sender(&scenario, factory);
//         };
        
//         test_scenario::end(scenario);
//     }


//     // Test: Create a launchpad using the factory with mocked one-time witness
//     #[test]
//     fun test_create_launchpad() {
//         let mut scenario = setup_scenario();
//         let creator = @0xA;
        
//         // Create factory
//         test_scenario::next_tx(&mut scenario, creator);
        

//         test_scenario::end(scenario);
//     }


//     // This test verifies all factory getter methods
//     #[test]
//     fun test_factory_getters() {
//         let mut scenario = setup_scenario();
//         let creator = @0xA;
        
//         // Create factory
//         let factory = create_test_factory(&mut scenario, creator);
        
//         // Verify initial state
//         assert!(factory::get_launchpad_count(&factory) == 0, 0);
//         assert!(vector::length(factory::get_all_launchpads(&factory)) == 0, 1);
        
//         // We can't directly test get_launchpads_by_creator since it requires a creator with launchpads
        
//         test_scenario::return_to_sender(&scenario, factory);
//         test_scenario::end(scenario);
//     }

// }