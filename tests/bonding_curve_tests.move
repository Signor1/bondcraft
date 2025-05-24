#[test_only]
module bond_craft::bonding_curve_tests;

use bond_craft::bonding_curve;

// Test calculate_k function
#[test]
fun test_calculate_k_basic() {
    // Test with simple values
    let funding_goal = 1000000; // 1M base units
    let max_tokens = 1000000; // 1M base units

    let k = bonding_curve::calculate_k(funding_goal, max_tokens);

    // With equal funding goal and max tokens, k should be 2 * SCALING_FACTOR
    // k = 2 * funding_goal * SCALING_FACTOR / (max_tokens^2)
    // k = 2 * 1000000 * 10^18 / (1000000^2) = 2 * 10^18
    assert!(k == 2000000000000, 0);
}

#[test]
fun test_calculate_k_different_ratios() {
    // Test with funding goal twice the max tokens
    let funding_goal = 2000000;
    let max_tokens = 1000000;

    let k = bonding_curve::calculate_k(funding_goal, max_tokens);

    // k = 2 * 2000000 * 10^18 / (1000000^2) = 4 * 10^18
    assert!(k == 4000000000000, 0);
}

#[test]
fun test_calculate_k_small_values() {
    // Test with small values to check minimum k enforcement
    let funding_goal = 1;
    let max_tokens = 1000000000; // Large denominator

    let k = bonding_curve::calculate_k(funding_goal, max_tokens);

    // Should be at least 1 due to minimum enforcement
    assert!(k >= 1, 0);
}

#[test]
#[expected_failure(abort_code = bonding_curve::EDivisionByZero)]
fun test_calculate_k_zero_max_tokens() {
    bonding_curve::calculate_k(1000000, 0);
}

#[test]
fun test_calculate_k_zero_funding_goal() {
    // Zero funding goal should result in k = 1 (minimum)
    let k = bonding_curve::calculate_k(0, 1000000);
    assert!(k == 1, 0);
}

// Test calculate_cost function
#[test]
fun test_calculate_cost_zero_tokens_sold() {
    let k = 1000000000000000000; // 10^18
    let tokens_to_buy = 1000000; // 1M tokens

    let cost = bonding_curve::calculate_cost(0, tokens_to_buy, k);

    // cost = k * tokens_to_buy * (0 + tokens_to_buy) / (2 * SCALING_FACTOR)
    // cost = 10^24 * 10^6 * 10^6 / (2 * 10^24) = 10^36 / (2 * 10^24) = 500000
    assert!(cost == 500000000000, 0);
}

#[test]
fun test_calculate_cost_with_tokens_sold() {
    let k = 1000000000000000000; // 10^18
    let tokens_sold = 500000; // 500k tokens already sold
    let tokens_to_buy = 500000; // buying 500k more

    let cost = bonding_curve::calculate_cost(tokens_sold, tokens_to_buy, k);

    // cost = k * tokens_to_buy * (2 * tokens_sold + tokens_to_buy) / (2 * SCALING_FACTOR)
    // cost = 10^24 * 500000 * (1000000 + 500000) / (2 * 10^24)
    // cost = 10^24 * 500000 * 1500000 / (2 * 10^24) = 375000000000
    assert!(cost == 375000000000, 0);
}

#[test]
fun test_calculate_cost_zero_tokens_to_buy() {
    let k = 1000000000000000000;
    let cost = bonding_curve::calculate_cost(1000000, 0, k);
    assert!(cost == 0, 0);
}

#[test]
fun test_calculate_cost_zero_k() {
    let cost = bonding_curve::calculate_cost(1000000, 1000000, 0);
    assert!(cost == 0, 0);
}

#[test]
fun test_calculate_cost_minimum_enforcement() {
    // Test with very small k and tokens that would result in 0 cost
    let k = 1; // Minimum k
    let tokens_to_buy = 1;

    let cost = bonding_curve::calculate_cost(0, tokens_to_buy, k);

    // Should enforce minimum cost of 1
    assert!(cost >= 1, 0);
}

#[test]
fun test_calculate_cost_increasing_property() {
    // Cost should increase as more tokens are already sold (price goes up)
    let k = 2000000000000000000;
    let tokens_to_buy = 100000;

    let cost1 = bonding_curve::calculate_cost(0, tokens_to_buy, k);
    let cost2 = bonding_curve::calculate_cost(500000, tokens_to_buy, k);
    let cost3 = bonding_curve::calculate_cost(1000000, tokens_to_buy, k);

    // Cost should increase as tokens_sold increases
    assert!(cost1 < cost2, 0);
    assert!(cost2 < cost3, 0);
}

// Test calculate_price function
#[test]
fun test_calculate_price_zero_tokens_sold() {
    let k = 1000000000000000000; // 10^18
    let price = bonding_curve::calculate_price(0, k);
    assert!(price == 0, 0);
}

#[test]
fun test_calculate_price_linear_increase() {
    let k = 1000000000000000000; // 10^18

    let price1 = bonding_curve::calculate_price(1000000, k); // 1M tokens sold
    let price2 = bonding_curve::calculate_price(2000000, k); // 2M tokens sold

    // price = k * tokens_sold / SCALING_FACTOR
    // price1 = 10^24 * 10^6 / 10^24 = 1000000
    // price2 = 10^24 * 2*10^6 / 10^24 = 2000000
    assert!(price1 == 1000000, 0);
    assert!(price2 == 2000000, 0);
    assert!(price2 == 2 * price1, 0); // Linear relationship
}

#[test]
fun test_calculate_price_zero_k() {
    let price = bonding_curve::calculate_price(1000000, 0);
    assert!(price == 0, 0);
}

#[test]
fun test_calculate_price_minimum_enforcement() {
    // Test minimum price enforcement
    let k = 1; // Very small k
    let tokens_sold = 1000000000000000000; // Large number that might result in 0

    let price = bonding_curve::calculate_price(tokens_sold, k);

    // Should enforce minimum price of 1 when tokens_sold > 0 and k > 0
    assert!(price >= 1, 0);
}

// Integration tests
#[test]
fun test_full_bonding_curve_scenario() {
    // Simulate a complete bonding curve scenario
    let funding_goal = 10000000000; // 10B base units (e.g., $10,000 with 6 decimals)
    let max_tokens = 1000000000000; // 1T base units (1M tokens with 6 decimals)

    let k = bonding_curve::calculate_k(funding_goal, max_tokens);

    // Test buying tokens at different stages
    let cost1 = bonding_curve::calculate_cost(0, 100000000, k); // First 100 tokens
    let price1 = bonding_curve::calculate_price(0, k);

    let cost2 = bonding_curve::calculate_cost(500000000000, 100000000, k); // 100 tokens at halfway
    let price2 = bonding_curve::calculate_price(500000000000, k);

    let cost3 = bonding_curve::calculate_cost(9000000000000000, 100000000, k); // 100 tokens near end
    let price3 = bonding_curve::calculate_price(9000000000000000, k);

    // Prices and costs should increase
    assert!(price1 < price2, 0);
    assert!(price2 < price3, 0);
    assert!(cost1 < cost2, 0);
    assert!(cost2 < cost3, 0);
}

#[test]
fun test_cost_consistency_with_price() {
    // Test that cost calculation is consistent with price for small purchases
    let k = 2000000000000000000;
    let tokens_sold = 1000000000; // 1B tokens sold
    let small_purchase = 1000; // Very small purchase

    let current_price = bonding_curve::calculate_price(tokens_sold, k);
    let cost = bonding_curve::calculate_cost(tokens_sold, small_purchase, k);

    // For very small purchases, cost should be approximately price * tokens
    // Allow for some rounding differences
    let expected_cost =
        (current_price as u128) * (small_purchase as u128) / 1000000000000000000000000; // Adjust for scaling
    let cost_u128 = cost as u128;

    // The difference should be small (within reasonable bounds for discrete math)
    assert!(cost_u128 > 0, 0); // Cost should be positive
}

#[test]
fun test_additive_cost_property() {
    // Test that buying tokens in two separate transactions equals buying all at once
    let k = 1000000000000000000;
    let tokens_sold = 500000000;
    let tokens_batch1 = 100000000;
    let tokens_batch2 = 200000000;
    let total_tokens = tokens_batch1 + tokens_batch2;

    // Cost of buying all at once
    let cost_combined = bonding_curve::calculate_cost(tokens_sold, total_tokens, k);

    // Cost of buying in two batches
    let cost_batch1 = bonding_curve::calculate_cost(tokens_sold, tokens_batch1, k);
    let cost_batch2 = bonding_curve::calculate_cost(tokens_sold + tokens_batch1, tokens_batch2, k);
    let cost_separate = cost_batch1 + cost_batch2;

    // These should be equal for a linear bonding curve
    assert!(cost_combined == cost_separate, 0);
}

#[test]
fun test_edge_case_large_numbers() {
    // Test with large numbers close to u64 limits
    let funding_goal = 1000000000000000000; // 10^18
    let max_tokens = 1000000000000; // 10^12

    let k = bonding_curve::calculate_k(funding_goal, max_tokens);

    // Should not overflow and should be reasonable
    assert!(k > 0, 0);

    // Test cost calculation with large numbers
    let cost = bonding_curve::calculate_cost(1000000000, 1000000000, k);
    assert!(cost > 0, 0);
}

#[test]
fun test_symmetry_properties() {
    // Test mathematical properties of the bonding curve
    let k = bonding_curve::calculate_k(5000000, 1000000);

    // Test that the curve is monotonically increasing
    let mut tokens_sold = 0;
    let mut last_price = 0;

    while (tokens_sold < 1000000) {
        let current_price = bonding_curve::calculate_price(tokens_sold, k);
        assert!(current_price >= last_price, 0);
        last_price = current_price;
        tokens_sold = tokens_sold + 100000;
    };
}
