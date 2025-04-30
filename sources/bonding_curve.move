module bond_craft::bonding_curve {
    
    // Constants for error codes
    const EDIVISION_BY_ZERO: u64 = 1000;
    const EOVERFLOW: u64 = 1001;

    // Scaling factor to handle precision in calculations
    const SCALING_FACTOR: u64 = 1_000_000_000; // 10^9 for precision

    /// Calculate the steepness factor `k` for the linear bonding curve.
    /// Formula: k = (2 * funding_goal * SCALING_FACTOR) / (max_tokens * max_tokens)
    public fun calculate_k(funding_goal: u64, max_tokens: u64): u64 {
        assert!(max_tokens != 0, EDIVISION_BY_ZERO);

        // Use u128 to prevent overflow in intermediate calculations
        let numerator = (2u128 * (funding_goal as u128) * (SCALING_FACTOR as u128));
        let denominator = ((max_tokens as u128) * (max_tokens as u128));

        assert!(denominator != 0, EDIVISION_BY_ZERO);

        let k = numerator / denominator;

        // Ensure k fits in u64
        assert!(k <= (18446744073709551615u128), EOVERFLOW);

        (k as u64)
    }

    /// Calculate the price of a token given the number of tokens sold and the steepness factor `k`.
    /// Formula: price = (k * tokens_sold) / SCALING_FACTOR
    public fun calculate_price(tokens_sold: u64, k: u64): u64 {
        // Use u128 to prevent overflow
        let price = ((k as u128) * (tokens_sold as u128)) / (SCALING_FACTOR as u128);

        // Ensure price fits in u64
        assert!(price <= (18446744073709551615u128), EOVERFLOW);

        (price as u64)
    }
}