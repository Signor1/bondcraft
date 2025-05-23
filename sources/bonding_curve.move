module bond_craft::bonding_curve {
    
    // Constants for error codes
    const EDivisionByZero: u64 = 1000;
    const EOverflow: u64 = 1001;

    // Scaling factor to handle precision in calculations
    const SCALING_FACTOR: u128 = 1_000_000_000_000_000_000_000_000; // 10^24

    /// Calculate the steepness factor `k` for the linear bonding curve.
    /// - `funding_goal`: Base units of funding token (e.g., USDC base units)
    /// - `max_tokens`: Base units of project token being sold
    public fun calculate_k(
        funding_goal: u64,
        max_tokens: u64,
        ): u64 {
        assert!(max_tokens != 0, EDivisionByZero);

        let funding_goal_u128 = (funding_goal as u128);
        let max_tokens_u128 = (max_tokens as u128);
        
        let numerator = 2u128 * funding_goal_u128 * (SCALING_FACTOR);
        let denominator = max_tokens_u128 * max_tokens_u128;
        
        assert!(denominator != 0, EDivisionByZero);
        
        // Calculate basic k
        let mut k = numerator / denominator;
        
        // Ensure k is at least 1 to avoid division by zero later
        if (k == 0) { k = 1 };

        assert!(k <= 18446744073709551615u128, EOverflow);
        (k as u64)
    }

    /// Calculate the total cost in base funding token units (e.g., USDC base units)
    /// - `tokens_sold`: Base units of project token already sold
    /// - `tokens_to_buy`: Base units of project token to buy
    /// - `k`: Precomputed bonding curve constant
    public fun calculate_cost(
        tokens_sold: u64,
        tokens_to_buy: u64,
        k: u64
    ): u64 {
        let tokens_sold_u128 = tokens_sold as u128;
        let tokens_to_buy_u128 = tokens_to_buy as u128;
        let k_u128 = k as u128;

        let numerator = k_u128 * tokens_to_buy_u128 * (2u128 * tokens_sold_u128 + tokens_to_buy_u128);
        let denominator = 2u128 * SCALING_FACTOR;

        assert!(denominator != 0, EDivisionByZero);
        
        let mut cost = numerator / denominator;

        // Enforce minimum cost of 1 if buying tokens and k > 0
        if (cost == 0 && tokens_to_buy > 0 && k > 0) { cost = 1 };
        
        assert!(cost <= 18446744073709551615u128, EOverflow);
        (cost as u64)
    }

    /// Calculate the current price per base project token in base funding token units
    public fun calculate_price(
        tokens_sold: u64,
        k: u64
    ): u64 {
        let tokens_sold_u128 = (tokens_sold as u128);
        let k_u128 = (k as u128);

        let price = (k_u128 * tokens_sold_u128) / SCALING_FACTOR;

        // Enforce minimum price of 1 if tokens sold and k > 0
        let mut price = (price as u64);
        if (price == 0 && tokens_sold > 0 && k > 0) { price = 1 };
        price
    }
}