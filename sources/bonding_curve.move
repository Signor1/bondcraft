module bond_craft::bonding_curve {
    
    // Constants for error codes
    const EDivisionByZero: u64 = 1000;
    const EOverflow: u64 = 1001;

    // Scaling factor to handle precision in calculations
    const SCALING_FACTOR: u64 = 1_000_000_000; // 10^9 for precision

    /// Calculate the steepness factor `k` for the linear bonding curve.
    /// This function is modified to properly handle decimal differences between
    /// funding tokens (USDC with 6 decimals) and project tokens (with 9 decimals)
    public fun calculate_k(
        funding_goal: u64,
        funding_decimals: u8,
        max_tokens: u64,
        token_decimals: u8
        ): u64 {
        assert!(max_tokens != 0, EDivisionByZero);

        // First, calculate basic k without decimals
        let funding_goal_base = (funding_goal as u128);
        let max_tokens_base = (max_tokens as u128);
        
        let numerator = 2u128 * funding_goal_base * (SCALING_FACTOR as u128);
        let denominator = max_tokens_base * max_tokens_base;
        
        assert!(denominator != 0, EDivisionByZero);
        
        // Calculate basic k
        let mut k = numerator / denominator;
        
        // Now adjust for decimal difference
        // For example: if token has 9 decimals and USDC has 6 decimals,
        // we need to adjust k by (10^(9-6))^2 = 10^6
        if (token_decimals != funding_decimals) {
            let decimal_diff = if (token_decimals > funding_decimals) {
                token_decimals - funding_decimals
            } else {
                funding_decimals - token_decimals
            };
            
            // Adjustment factor: 10^(decimal_diff * 2) because max_tokens is squared in denominator
            let adjustment_factor = (10u128).pow((decimal_diff * 2) as u8);
            
            if (token_decimals > funding_decimals) {
                // If token has more decimals than funding token, increase k
                k = k * adjustment_factor;
            } else {
                // If token has fewer decimals than funding token, decrease k
                k = k / adjustment_factor;
            };
        };
        
        // Ensure k is at least 1 to prevent truncation to zero
        if (k == 0) { k = 1 };

        assert!(k <= 18446744073709551615u128, EOverflow);

        (k as u64)
    }

    /// Calculate the price of a token given the number of tokens sold and the steepness factor `k`.
    /// Adjusted to handle decimal differences correctly
    public fun calculate_price(
        tokens_sold: u64,
        token_decimals: u8,
        k: u64
    ): u64 {
        // For Sui tokens with 9 decimals and USDC with 6 decimals
        // We need to adjust by 10^(9-6) = 10^3
        let decimal_adjustment = 10u128.pow((token_decimals as u8) - 6);

        // Convert sold tokens to base units with decimal adjustment
        let tokens_sold_adjusted = (tokens_sold as u128);

        // Use u128 for calculation to prevent overflow
        let mut price = ((k as u128) * tokens_sold_adjusted) / (SCALING_FACTOR as u128);

        // Apply decimal adjustment to get price in USDC units (6 decimals)
        price = price / decimal_adjustment;
        
        // Ensure non-zero price if there are tokens sold and k is non-zero
        if (price == 0 && tokens_sold > 0 && k > 0) { price = 1 };
        
        assert!(price <= 18446744073709551615u128, EOverflow);

        (price as u64)
    }

    // Helper function to calculate total cost for buying tokens
    // Uses the linear bonding curve formula: total cost = (k * tokens_sold * tokens) / (2 * SCALING_FACTOR)
    public fun calculate_cost(
        tokens_sold: u64,
        tokens_to_buy: u64,
        token_decimals: u8,
        k: u64
    ): u64 {
        // Start price
        let start_price = calculate_price(tokens_sold, token_decimals, k);
        
        // End price after purchase
        let end_price = calculate_price(tokens_sold + tokens_to_buy, token_decimals, k);
        
        // Average price
        let avg_price = (start_price + end_price) / 2;
        
        // Total cost = avg_price * tokens_to_buy
        let cost = (avg_price as u128) * (tokens_to_buy as u128);
        
        assert!(cost <= 18446744073709551615u128, EOverflow);
        
        (cost as u64)
    }
}