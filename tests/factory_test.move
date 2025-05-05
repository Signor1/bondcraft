module bond_craft::factory_tests{
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self};

    use bond_craft::factory::{Self, LaunchpadFactory};
    use bond_craft::launchpad::{Self};
    use usdc::usdc::USDC;

    // Helper function to set up a scenario
    fun setup_scenario(): Scenario {
        test_scenario::begin(@0x1)
    }

    // Helper function to create a factory object
    fun create_test_factory(scenario: &mut Scenario, creator: address): LaunchpadFactory {
        test_scenario::next_tx(scenario, creator);
        let ctx = test_scenario::ctx(scenario);
        
        factory::create_factory(ctx);
        
        test_scenario::next_tx(scenario, creator);
        test_scenario::take_from_sender<LaunchpadFactory>(scenario)
    }

    // Helper to create mock USDC for testing
    fun create_mock_usdc(scenario: &mut Scenario, amount: u64, recipient: address) {
        test_scenario::next_tx(scenario, recipient);
        let ctx = test_scenario::ctx(scenario);

        let usdc = coin::mint_for_testing<USDC>(amount, ctx);
        transfer::public_transfer(usdc, recipient);
    }



    // Test: Create a factory
    #[test]
    fun test_create_factory() {
        let mut scenario = setup_scenario();
        let creator = @0xA;
        
        // Create factory
        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            factory::create_factory(ctx);
        };
        
        // Verify factory is created
        test_scenario::next_tx(&mut scenario, creator);
        {
            let factory = test_scenario::take_from_sender<LaunchpadFactory>(&scenario);
            
            // Verify factory properties
            assert!(factory::get_launchpad_count(&factory) == 0, 0);
            assert!(vector::length(factory::get_all_launchpads(&factory)) == 0, 1);
            
            test_scenario::return_to_sender(&scenario, factory);
        };
        
        test_scenario::end(scenario);
    }


    // Test: Create a launchpad using the factory with mocked witness
    #[test]
    fun test_create_launchpad() {
        let mut scenario = setup_scenario();
        let creator = @0xA;
    
        // Create factory
        let mut factory = create_test_factory(&mut scenario, creator);
    
        // Create mock USDC
        create_mock_usdc(&mut scenario, 100_000_000, creator);
    
        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
        
            // Use test-only create function
            let launchpad = launchpad::create_test(
                ctx,
                b"TKN",
                b"Test Token",
                9,
                1_000_000_000,
                500_000_000,
                200_000_000,
                200_000_000,
                100_000_000,
                50_000_000,
                creator
            );

            let launchpad_id = object::id(&launchpad);
            transfer::public_transfer(launchpad, creator);

            // Update factory state using helper functions
            factory::add_launchpad_to_creator(&mut factory, creator, launchpad_id);
            factory::add_to_all_launchpads(&mut factory, launchpad_id);
            factory::increment_launchpad_count(&mut factory);
        };
    
        // Verify launchpad creation
        test_scenario::next_tx(&mut scenario, creator);
        {
            let launchpads = factory::get_launchpads_by_creator(&factory, creator);
            assert!(vector::length(launchpads) == 1, 0);
            assert!(factory::get_launchpad_count(&factory) == 1, 1);
            assert!(vector::length(factory::get_all_launchpads(&factory)) == 1, 2);
        };
    
        test_scenario::return_to_sender(&scenario, factory);
        test_scenario::end(scenario);
    }


    // Test: Verify all factory getter methods
    #[test]
    fun test_factory_getters() {
        let mut scenario = setup_scenario();
        let creator = @0xA;
        
        // Create factory
        let mut factory = create_test_factory(&mut scenario, creator);
        
        // Verify initial state
        assert!(factory::get_launchpad_count(&factory) == 0, 0);
        assert!(vector::length(factory::get_all_launchpads(&factory)) == 0, 1);
        
        // Add a launchpad to test get_launchpads_by_creator
        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let launchpad = launchpad::create_test(
                ctx,
                b"TKN",
                b"Test Token",
                9,
                1_000_000_000,
                500_000_000,
                200_000_000,
                200_000_000,
                100_000_000,
                50_000_000,
                creator
            );
            let launchpad_id = object::id(&launchpad);
            transfer::public_transfer(launchpad, creator);

            // Update factory state using helper functions
            factory::add_launchpad_to_creator(&mut factory, creator, launchpad_id);
            factory::add_to_all_launchpads(&mut factory, launchpad_id);
            factory::increment_launchpad_count(&mut factory);
        };
        
        // Verify getter methods
        test_scenario::next_tx(&mut scenario, creator);
        {
            let launchpads = factory::get_launchpads_by_creator(&factory, creator);
            assert!(vector::length(launchpads) == 1, 2);
            assert!(factory::get_launchpad_count(&factory) == 1, 3);
            assert!(vector::length(factory::get_all_launchpads(&factory)) == 1, 4);
        };
        
        test_scenario::return_to_sender(&scenario, factory);
        test_scenario::end(scenario);
    }

}