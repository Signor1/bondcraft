module bond_craft::factory{
    use bond_craft::launchpad;
    use sui::table::{Self, Table};
    use std::unit_test::assert_eq;

    public struct LaunchpadFactory has key {
        id: UID,
        template: ID,
        launchpad_count:u64,
        launchpads: Table<address, vector<ID>>,
        all_launchpads: vector<address>,
    }

    public fun create_factory(ctx: &mut TxContext, template: ID){
        transfer::transfer(LaunchpadFactory{
            id: object::new(ctx),
            template,
            launchpad_count: 0,
            launchpads: table::new(ctx),
            all_launchpads: vector::empty<address>(),
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
        assert_eq!((funding_tokens + creator_tokens + liquidity_tokens + platform_tokens), total_supply);
        
        
        let creator = tx_context::sender(ctx);
        
        let launchpad = launchpad::create(
            total_supply,
            funding_tokens,
            creator_tokens,
            liquidity_tokens,
            platform_tokens,
            funding_goal,
            ctx
        );
        let launchpad_id = object::id(&launchpad);

        if (!table::contains(&factory.launchpads, creator)) {
            table::add(&mut factory.launchpads, creator, vector::empty());
        };
        
        let creator_launchpads = table::borrow_mut(&mut factory.launchpads, creator);
        vector::push_back(creator_launchpads, launchpad_id);

        transfer::transfer(launchpad, creator);
    }
}