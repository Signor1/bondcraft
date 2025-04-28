module bond_craft::factory{
    use bond_craft::launchpad;

    public struct LaunchpadFactory has key {
        id: UID,
        template: ID,
        launchpad_count:u64,
    }

    public fun create_factory(ctx: &mut TxContext, template: ID){
        transfer::transfer(LaunchpadFactory{
            id: object::new(ctx),
            template,
            launchpad_count: 0,
        }, tx_context::sender(ctx));
    }

    public fun create_launchpad(
        factory: &mut LaunchpadFactory,
        total_supply: u64,
        funding_tokens: u64,
        creator_tokens: u64,
        liquidity_tokens: u64,
        platform_tokens: u64,
        funding_goal: u64,
        ctx: &mut TxContext
    ) {
        assert!(
            funding_tokens + creator_tokens + liquidity_tokens + platform_tokens == total_supply,
            0
        );
        
        let launchpad = launchpad::create(
            total_supply,
            funding_tokens,
            creator_tokens,
            liquidity_tokens,
            platform_tokens,
            funding_goal,
            ctx
        );
        
        factory.launchpad_count = factory.launchpad_count + 1;
    }
}