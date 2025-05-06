module bond_craft::pool{
    use sui::coin::{Self, Coin, CoinMetadata};
    use sui::clock::{Clock};
    use std::string::{Self, String};
    use sui::math;
    use sui::event;

    use cetus_clmm::pool_creator;
    use cetus_clmm::factory::{Pools};
    use cetus_clmm::config::GlobalConfig;
    use cetus_clmm::tick_math;
    use integer_mate::i32::{Self, I32};

    // Error codes
    const EINVALID_TICK_RANGE: u64 = 1;
    const EINVALID_LIQUIDITY: u64 = 2;
    const EINVALID_TICK_SPACING: u64 = 3;
    const ETICK_NOT_ALIGNED: u64 = 4;
    const EINSUFFICIENT_LIQUIDITY: u64 = 5;
    const EINVALID_PRICE: u64 = 6;

    // Events
    public struct PoolCreatedEvent has copy, drop {
        sender: address,
        token_type: String, // Token type (e.g., LaunchpadWitness)
        usdc_type: String, // USDC type
        fee_tier: u32, // Tick spacing (e.g., 500 for 0.05%)
        final_price: u64, // Final price in USDC decimals
        sqrt_price: u128, // Initial sqrt price
        tick: I32, // Initial tick
        epoch: u64, // Epoch of creation
    }

    #[allow(deprecated_usage)]
    public fun price_to_sqrt_price(price: u64, decimals_t: u8, decimals_usdc: u8): u128{

        // Adjust for decimal difference: price = (T/USDC) * 10^(decimals_t - decimals_usdc)
        let decimal_adjustment = if (decimals_t > decimals_usdc) {
            math::pow(10, (decimals_t - decimals_usdc as u8))
        } else {
            1
        };

        // Perform multiplication in u64 to avoid u128 where possible
        let adjusted_price = price / decimal_adjustment;

        // Calculate sqrt(price) * 2^96
        // Since sqrt requires u64, ensure adjusted_price is within bounds
        assert!(adjusted_price <= 0xFFFFFFFFFFFFFFFF, EINVALID_PRICE); // Ensure no overflow
        let sqrt_price = (math::sqrt(adjusted_price) as u128) * (1u128 << 96);

        // Clamp sqrt_price to Cetus bounds
        let min_sqrt = tick_math::min_sqrt_price();
        let max_sqrt = tick_math::max_sqrt_price();

        if (sqrt_price < min_sqrt) {
            min_sqrt
        } else if (sqrt_price > max_sqrt) {
            max_sqrt
        } else {
            sqrt_price
        }
    }

    public fun price_to_tick(price: u64, decimals_t: u8, decimals_usdc: u8): I32 {
        let sqrt_price = price_to_sqrt_price(price, decimals_t, decimals_usdc);
        tick_math::get_tick_at_sqrt_price(sqrt_price)
    }

    /// Creates a Cetus CLMM pool for T/USDC with initial liquidity.
    /// Parameters:
    /// - `cetus_config`: Cetus GlobalConfig object.
    /// - `pools`: Cetus Pools object for pool management.
    /// - `token`: Initial T tokens for liquidity.
    /// - `usdc`: Initial USDC tokens for liquidity.
    /// - `final_price`: Bonding curve's final price (T per USDC, scaled to 6 decimals).
    /// - `tick_spacing`: Fee tier (e.g., 100 for 0.01%, 500 for 0.05%, 3000 for 0.3%).
    /// - `pool_name`: Metadata name for the pool.
    /// - `metadata_t`: Metadata for token T (assumed 9 decimals).
    /// - `metadata_usdc`: Metadata for USDC (assumed 6 decimals).
    /// - `clock`: Sui Clock object.
    /// - `ctx`: Transaction context.
    /// Returns: (Position NFT, unused T, unused USDC).
    #[allow(lint(self_transfer))]
    public fun create_pool<T, USDC>(
        cetus_config: &GlobalConfig,
        pools: &mut Pools,
        token: Coin<T>,
        usdc: Coin<USDC>,
        final_price: u64,
        tick_spacing: u32,
        pool_name: String,
        metadata_t: &CoinMetadata<T>,
        metadata_usdc: &CoinMetadata<USDC>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tick_spacing == 100 || tick_spacing == 500 || tick_spacing == 3000, EINVALID_TICK_SPACING);

        // Calculate tick from price
        let tick = price_to_tick(final_price, 9, 6);
        let sqrt_price = tick_math::get_sqrt_price_at_tick(tick);

        // Define liquidity range: ±tick_spacing around current tick
        let tick_lower = i32::sub(tick, i32::from(tick_spacing));
        let tick_upper = i32::add(tick, i32::from(tick_spacing));

        // Validate tick range
        assert!(
            i32::gte(tick_lower, tick_math::min_tick()) && i32::lte(tick_upper, tick_math::max_tick()),
            EINVALID_TICK_RANGE
        );

        // Ensure ticks are aligned with tick_spacing
        assert!(tick_math::is_valid_index(tick_lower, tick_spacing), ETICK_NOT_ALIGNED);
        assert!(tick_math::is_valid_index(tick_upper, tick_spacing), ETICK_NOT_ALIGNED);

        // Validate liquidity
        let token_value = coin::value(&token);
        let usdc_value = coin::value(&usdc);
        assert!(token_value > 0 && usdc_value > 0, EINVALID_LIQUIDITY);
        assert!(token_value >= 1000 && usdc_value >= 1000, EINSUFFICIENT_LIQUIDITY);

        // Convert ticks to u32 for create_pool_v2
        let tick_lower_u32 = i32::as_u32(i32::abs(tick_lower));
        let tick_upper_u32 = i32::as_u32(i32::abs(tick_upper));

        // Create pool
        let (position, remaining_token, remaining_usdc) = pool_creator::create_pool_v2<T, USDC>(
            cetus_config,
            pools,
            tick_spacing,
            sqrt_price,
            pool_name,
            tick_lower_u32,
            tick_upper_u32,
            token,
            usdc,
            metadata_t,
            metadata_usdc,
            true, // Fix token amount (T)
            clock,
            ctx
        );

        let sender = tx_context::sender(ctx);
        transfer::public_transfer(position, sender);
        transfer::public_transfer(remaining_token, sender);
        transfer::public_transfer(remaining_usdc, sender);

        // Emit event
        event::emit(PoolCreatedEvent{
            sender,
            token_type: string::utf8(b"LaunchpadWitness"),
            usdc_type: string::utf8(b"USDC"),
            fee_tier: tick_spacing,
            final_price,
            sqrt_price,
            tick,
            epoch: tx_context::epoch(ctx),
        });
    }

    /// Calculates sqrt price from bonding curve's final price.
    public fun calculate_sqrt_price(final_price: u64): u128 {
        price_to_sqrt_price(final_price, 9, 6)
    }


    #[test_only]
    public fun create_pool_test<T, USDC>(
        token: Coin<T>,
        usdc: Coin<USDC>,
        tick_spacing: u32,
        ctx: &mut TxContext
    ) {
        // Validate inputs (mimic create_pool logic)
        assert!(tick_spacing == 100 || tick_spacing == 500 || tick_spacing == 3000, EINVALID_TICK_SPACING);
        assert!(coin::value(&token) >= 1000 && coin::value(&usdc) >= 1000, EINSUFFICIENT_LIQUIDITY);

        // Simulate pool creation by transferring coins back
        let sender = tx_context::sender(ctx);
        transfer::public_transfer(token, sender);
        transfer::public_transfer(usdc, sender);
        
        // Simulate position NFT as a dummy coin
        let position = coin::mint_for_testing<T>(1000, ctx);
        transfer::public_transfer(position, sender);
    }
}