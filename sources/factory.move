module bond_craft::factory{
    use sui::table::{Self, Table};
    use bond_craft::launchpad;


    // Error codes
    const ENOT_FOUND: u64 = 0;
    const EINVALID_SUPPLY: u64 = 1;
    const EINVALID_NAME: u64 = 2;
    const EINVALID_SYMBOL: u64 = 3;
    const EINVALID_DECIMALS: u64 = 4;

    public struct LaunchpadFactory has key {
        id: UID,
        launchpad_count: u64,
        launchpads: Table<address, vector<ID>>,
        all_launchpads: vector<ID>,
    }

    public fun create_factory(ctx: &mut TxContext){
        transfer::transfer(LaunchpadFactory{
            id: object::new(ctx),
            launchpad_count: 0,
            launchpads: table::new(ctx),
            all_launchpads: vector::empty<ID>(),
        }, 
        tx_context::sender(ctx)
        );
    }

    #[allow(lint(self_transfer))]
    public fun create_launchpad(
        factory: &mut LaunchpadFactory,
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
    ) {
        assert!(
            funding_tokens + creator_tokens + liquidity_tokens + platform_tokens == total_supply,
            EINVALID_SUPPLY
        );
        assert!(&name != vector::empty<u8>(), EINVALID_NAME);
        assert!(&symbol != vector::empty<u8>(), EINVALID_SYMBOL);
        assert!(decimals >= 6, EINVALID_DECIMALS);
        
        let creator = tx_context::sender(ctx);
        let platform_admin = creator;

        let launchpad = launchpad::create(
            ctx,
            symbol,
            name,
            decimals,
            total_supply,
            funding_tokens,
            creator_tokens,
            liquidity_tokens,
            platform_tokens,
            funding_goal,
            platform_admin
        );
        let launchpad_id = object::id(&launchpad);

        // Updating factory state using helper functions
        add_launchpad_to_creator(factory, creator, launchpad_id);
        add_to_all_launchpads(factory, launchpad_id);
        increment_launchpad_count(factory);

        transfer::public_transfer(launchpad, creator);
    }

     // Helper function to check if a creator has launchpads
    public fun has_launchpads(factory: &LaunchpadFactory, creator: address): bool {
        table::contains(&factory.launchpads, creator)
    }

    // Helper function to add a launchpad ID to a creator’s list
    public fun add_launchpad_to_creator(factory: &mut LaunchpadFactory, creator: address, launchpad_id: ID) {
        if (!table::contains(&factory.launchpads, creator)) {
            table::add(&mut factory.launchpads, creator, vector::empty());
        };
        vector::push_back(table::borrow_mut(&mut factory.launchpads, creator), launchpad_id);
    }

    // Helper function to add a launchpad ID to all_launchpads
    public fun add_to_all_launchpads(factory: &mut LaunchpadFactory, launchpad_id: ID) {
        vector::push_back(&mut factory.all_launchpads, launchpad_id);
    }

    // Helper function to increment launchpad_count
    public fun increment_launchpad_count(factory: &mut LaunchpadFactory) {
        factory.launchpad_count = factory.launchpad_count + 1;
    }

    //============GETTER FUNCTIONS================
    
    public fun get_launchpads_by_creator(
        factory: &LaunchpadFactory,
        creator: address
    ): &vector<ID> {
        assert!(table::contains(&factory.launchpads, creator), ENOT_FOUND);
        table::borrow(&factory.launchpads, creator)
    }

    public fun get_all_launchpads(factory: &LaunchpadFactory): &vector<ID>{
        &factory.all_launchpads
    }

    public fun get_launchpad_count(factory: &LaunchpadFactory): u64{
        factory.launchpad_count
    }
}