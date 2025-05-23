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
        // Convert to u128 for calculations to prevent overflow
        let tokens_sold_u128 = tokens_sold as u128;
        let tokens_to_buy_u128 = tokens_to_buy as u128;
        let k_u128 = k as u128;
        let scaling_factor_u128 = SCALING_FACTOR as u128;

        // For a linear bonding curve: price = k * tokens_sold / SCALING_FACTOR
        // The integral of this from tokens_sold to (tokens_sold + tokens_to_buy) is:
        // cost = k * (tokens_to_buy * (2 * tokens_sold + tokens_to_buy)) / (2 * SCALING_FACTOR)

        let numerator = k_u128 * tokens_to_buy_u128 * (2u128 * tokens_sold_u128 + tokens_to_buy_u128);
        let denominator = 2u128 * scaling_factor_u128;

        assert!(denominator != 0, EDivisionByZero);
        
        let mut cost = numerator / denominator;

        // Apply decimal adjustment to convert from token units to USDC units
        let decimal_adjustment = 10u128.pow((token_decimals as u8) - 6);
        cost = cost / decimal_adjustment;

        // Ensure minimum cost of 1 if tokens are being bought and k > 0
        if (cost == 0 && tokens_to_buy > 0 && k > 0) { 
            cost = 1; 
        };
        
        assert!(cost <= 18446744073709551615u128, EOverflow);
        
        (cost as u64)
    }
}