module bond_craft::bonding_curve_tests {
    use bond_craft::bonding_curve;
    
    // Test calculating steepness factor (k)
    #[test]
    fun test_calculate_k() {
        
        let funding_goal = 100_000;    // 100,000 USDC (1e5 * 1e6 = 1e11)
        let funding_decimals = 6;
        let max_tokens = 1;            // 1 token (1e9 base units)
        let token_decimals = 9;
        
        let k = bonding_curve::calculate_k(
            funding_goal,
            funding_decimals,
            max_tokens,
            token_decimals
        );
        // funding_base = 1e5 * 1e6 = 1e11
        // tokens_base = 1 * 1e9 = 1e9
        // numerator = 2 * 1e11 * 1e9 = 2e20
        // denominator = (1e9)^2 = 1e18
        // k = 2e20 / 1e18 = 200
        assert!(k == 200, 0);
    }
    
    // Test calculating price at different token amounts
    #[test]
    fun test_calculate_price() {
        let k = 200;
        let token_decimals = 9;
    
        // Test price for 500 tokens (500 * 10^9 base units)
        let tokens_sold = 500;
        let price = bonding_curve::calculate_price(tokens_sold, token_decimals, k);
    
        // Calculation:
        // (200 * 500 * 10^9) / 10^9 = 100,000
        assert!(price == 100_000, 0); // 100,000 micro USDC = 0.1 USDC
    
        // Test price for 1000 tokens
        let price = bonding_curve::calculate_price(1000, token_decimals, k);
        assert!(price == 200_000, 1); // 0.2 USDC
    }
    
    // Test edge cases
    #[test]
    #[expected_failure(abort_code = 1000, location = bond_craft::bonding_curve)] // EDIVISION_BY_ZERO
    fun test_calculate_k_zero_max_tokens() {
        bonding_curve::calculate_k(
            1000,   // funding_goal
            6,      // funding_decimals
            0,      // max_tokens (invalid)
            9       // token_decimals
        );
    }
    
    // Test with larger but valid numbers
    #[test]
    fun test_large_numbers() {
        let funding_goal = 1_000_000_000; // 1B USDC (1e9 * 1e6 = 1e15)
        let max_tokens = 1_000;  // 1,000 tokens (1e12 base units)

        let k = bonding_curve::calculate_k(
            funding_goal,
            6,
            max_tokens,
            9
        );
        // numerator = 2 * 1e15 * 1e9 = 2e24
        // denominator = (1e12)^2 = 1e24
        // k = 2e24 / 1e24 = 2
        assert!(k == 2, 0);
        
        // Price calculation for 500 tokens
        let price = bonding_curve::calculate_price(500, 9, k);
        assert!(price == 1000, 1); // (2 * 500 * 1e9) / 1e9 = 1000
    }
}