module bond_craft::bonding_curve {
    
    // Constants for error codes
    const EDIVISION_BY_ZERO: u64 = 1000;
    const EOVERFLOW: u64 = 1001;

    // Scaling factor to handle precision in calculations
    const SCALING_FACTOR: u64 = 1_000_000_000; // 10^9 for precision

    /// Calculate the steepness factor `k` for the linear bonding curve.
    /// Formula: k = (2 * funding_goal * SCALING_FACTOR) / (max_tokens * max_tokens)
    public fun calculate_k(
        funding_goal: u64,
        funding_decimals: u8,
        max_tokens: u64,
        token_decimals: u8
        ): u64 {
        assert!(max_tokens != 0, EDIVISION_BY_ZERO);

        // Convert to base units using u8 exponents
        let funding_goal_base = (funding_goal as u128) * (10u128).pow(funding_decimals);
        let max_tokens_base = (max_tokens as u128) * (10u128).pow(token_decimals);

        let numerator = 2u128 * funding_goal_base * (SCALING_FACTOR as u128);
        let denominator = max_tokens_base * max_tokens_base;

        assert!(denominator != 0, EDIVISION_BY_ZERO);
        let k = numerator / denominator;

        // Use literal for u64 max value
        assert!(k <= 18446744073709551615u128, EOVERFLOW);

        (k as u64)
    }

    /// Calculate the price of a token given the number of tokens sold and the steepness factor `k`.
    /// Formula: price = (k * tokens_sold) / SCALING_FACTOR
    public fun calculate_price(
        tokens_sold: u64,
        token_decimals: u8,
        k: u64
    ): u64 {
        // Use token_decimals directly as u8 for pow()
        let tokens_sold_base = (tokens_sold as u128) * (10u128).pow(token_decimals);
        let price = ((k as u128) * tokens_sold_base) / 1_000_000_000u128;
        
        // Use literal instead of u64::MAX
        assert!(price <= 18446744073709551615u128, EOVERFLOW);

        (price as u64)
    }
}