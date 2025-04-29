module bond_craft::launchpad{
    use sui::coin::{Coin, TreasuryCap};
    use sui::balance::{Balance, Self};
    use sui::math;


    public struct Launchpad<phantom T> has key{
        id: UID,
        treasury: TreasuryCap<T>,
        params: LaunchParams,
        state: LaunchState,
        creator: address
    }

    public struct LaunchParams has store{
        total_supply: u64,
        funding_tokens: u64,
        creator_tokens: u64,
        liquidity_tokens: u64,
        platform_tokens: u64,
        funding_goal: u64,
        k: u64
    }

    public struct LaunchState has store{
        tokens_sold: u64,
        phase: u8
    }

    public fun create(
        total_supply: u64,
        funding_tokens: u64,
        creator_tokens: u64,
        liquidity_tokens: u64,
        platform_tokens: u64,
        funding_goal: u64,
        ctx: &mut TxContext
    ): Launchpad<T>{
        let k = calculate_k(funding_goal, funding_tokens);
        let (treasury, metadata) = coin::create_currency(total_supply, ctx);

        Launchpad {
            id: object::new(ctx),
            treasury,
            params: LaunchParams {
                total_supply,
                funding_tokens,
                creator_tokens,
                liquidity_tokens,
                platform_tokens,
                funding_goal,
                k
            },
            state: LaunchState {
                tokens_sold: 0,
                phase: 0
            },
            creator: tx_context::sender(ctx)
        }
    }

    fun calculate_k(funding_goal: u64, max_tokens: u64): u64 {
        (math::checked_mul(funding_goal, 2000000) / 
        math::checked_mul(max_tokens, max_tokens))
    }
}