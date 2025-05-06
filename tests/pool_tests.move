module bond_craft::pool_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin};

    use bond_craft::pool;

    // For tests, we need a one-time witness
    public struct TEST_TOKEN has drop {}
    public struct TEST_USDC has drop {}

    // Helper function to set up a scenario
    fun setup_scenario(): Scenario {
        test_scenario::begin(@0x1)
    }

    // Helper to create mock coins
    fun create_mock_coins<T: drop>(scenario: &mut Scenario, amount: u64, recipient: address): Coin<T> {
        test_scenario::next_tx(scenario, @0x1);
        let ctx = test_scenario::ctx(scenario);

        let coin = coin::mint_for_testing<T>(amount, ctx);
        transfer::public_transfer(coin, recipient);
        test_scenario::next_tx(scenario, recipient);
        test_scenario::take_from_sender<Coin<T>>(scenario)
    }


    // Test: create_pool functionality (using test-only version)
    #[test]
    fun test_create_pool() {
        let mut scenario = setup_scenario();
        let creator = @0xA;

        // Create mock coins
        let token = create_mock_coins<TEST_TOKEN>(&mut scenario, 10_000_000_000, creator); // 10B tokens
        let usdc = create_mock_coins<TEST_USDC>(&mut scenario, 10_000_000_000_000, creator); // 10M USDC

        // Create pool using test-only function
        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            pool::create_pool_test<TEST_TOKEN, TEST_USDC>(
                token,
                usdc,
                500, // 0.05% fee tier
                ctx
            );
        };

        // Verify creator received position and remaining coins
        test_scenario::next_tx(&mut scenario, creator);
        {
            // Check for position NFT (mocked as Coin<TEST_TOKEN>)
            assert!(test_scenario::has_most_recent_for_sender<Coin<TEST_TOKEN>>(&scenario), 0);
            let position = test_scenario::take_from_sender<Coin<TEST_TOKEN>>(&scenario);
            assert!(coin::value(&position) == 1000, 1); // Mocked position value
            test_scenario::return_to_sender(&scenario, position);

            // Check for remaining TOKEN
            assert!(test_scenario::has_most_recent_for_sender<Coin<TEST_TOKEN>>(&scenario), 2);
            let remaining_token = test_scenario::take_from_sender<Coin<TEST_TOKEN>>(&scenario);
            assert!(coin::value(&remaining_token) == 10_000_000_000, 3); // Full amount returned
            test_scenario::return_to_sender(&scenario, remaining_token);

            // Check for remaining USDC
            assert!(test_scenario::has_most_recent_for_sender<Coin<TEST_USDC>>(&scenario), 4);
            let remaining_usdc = test_scenario::take_from_sender<Coin<TEST_USDC>>(&scenario);
            assert!(coin::value(&remaining_usdc) == 10_000_000_000_000, 5); // Full amount returned
            test_scenario::return_to_sender(&scenario, remaining_usdc);
        };

        test_scenario::end(scenario);
    }
    
}