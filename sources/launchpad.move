module bond_craft::launchpad{
    use sui::coin::{Self, TreasuryCap};
    // use sui::balance::{Self, Balance};
    use bond_craft::bonding_curve;

    const EINVALID_ALLOCATION: u64 = 1;
    const EINVALID_NAME: u64 = 2;
    const EINVALID_SYMBOL: u64 = 3;
    const EINVALID_DECIMALS: u64 = 4;
    const EINVALID_FUNDING_GOAL: u64 = 5;
    const EINVALID_TOTAL_SUPPLY: u64 = 6;

    public struct ProjectToken has drop {}

    public struct Launchpad<phantom T> has key, store{
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

    public fun get_project_token(): ProjectToken {
        ProjectToken {}
    }

    public fun create<T: drop>(
        _witness: T,
        symbol: vector<u8>,
        name: vector<u8>,
        decimals: u8,
        total_supply: u64,
        funding_tokens: u64,
        creator_tokens: u64,
        liquidity_tokens: u64,
        platform_tokens: u64,
        funding_goal: u64,
        ctx: &mut TxContext
    ): Launchpad<T>{
        assert!(
            funding_tokens + creator_tokens + liquidity_tokens + platform_tokens == total_supply,
            EINVALID_ALLOCATION
        );
        assert!(&name != vector::empty<u8>(), EINVALID_NAME);
        assert!(&symbol != vector::empty<u8>(), EINVALID_SYMBOL);
        assert!(decimals >= 6, EINVALID_DECIMALS);
        assert!(funding_goal > 0, EINVALID_FUNDING_GOAL);
        assert!(total_supply > 0, EINVALID_TOTAL_SUPPLY);

        let k = bonding_curve::calculate_k(funding_goal, funding_tokens);

        let (treasury, metadata) = coin::create_currency<T>(
            _witness,
            decimals,
            symbol,
            name,
            b"Project Token", // Description
            option::none(), // Icon URL
            ctx
        );

        transfer::public_freeze_object(metadata);

        Launchpad<T> {
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

}