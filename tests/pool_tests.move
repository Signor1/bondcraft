module bond_craft::pool_tests{
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, TreasuryCap, CoinMetadata};
    use std::option;
    use integer_mate::i32::{Self, I32};
    
    use bond_craft::pool;
    
    // For tests, we need a one-time witness
    public struct TEST_TOKEN has drop {}
    public struct TEST_USDC has drop {}
    
    // Helper function to set up a scenario
    fun setup_scenario(): Scenario {
        test_scenario::begin(@0x1)
    }

    // Test: price_to_sqrt_price conversion
    #[test]
    fun test_price_to_sqrt_price(){
        // Test with various price levels
        
        // Price = 1 (1 TOKEN = 1 USDC)
        let price_1 = 1_000_000; // Assuming 6 decimal places
        let sqrt_price_1 = pool::price_to_sqrt_price(price_1, 9, 6);
        
        // Price = 2 (2 TOKEN = 1 USDC)
        let price_2 = 2_000_000; // Assuming 6 decimal places
        let sqrt_price_2 = pool::price_to_sqrt_price(price_2, 9, 6);

        // Price = 0.5 (0.5 TOKEN = 1 USDC)
        let price_05 = 500_000; // Assuming 6 decimal places
        let sqrt_price_05 = pool::price_to_sqrt_price(price_05, 9, 6);
        
    }
}