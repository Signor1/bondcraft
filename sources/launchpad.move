module bond_craft::launchpad{
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::balance::{Self, Balance};
    use bond_craft::bonding_curve;

    // Testnet USDC type
    use usdc::usdc::USDC;

    // Error codes
    const EINVALID_ALLOCATION: u64 = 1;
    const EINVALID_NAME: u64 = 2;
    const EINVALID_SYMBOL: u64 = 3;
    const EINVALID_DECIMALS: u64 = 4;
    const EINVALID_FUNDING_GOAL: u64 = 5;
    const EINVALID_TOTAL_SUPPLY: u64 = 6;
    const EINSUFFICIENT_PAYMENT: u64 = 7;
    const EINVALID_PHASE: u64 = 8;
    const EUNAUTHORIZED: u64 = 9;
    const EINSUFFICIENT_TOKENS: u64 = 10;
    const EVESTING_NOT_READY: u64 = 11;

    // Phase constants
    const PHASE_OPEN: u8 = 0;
    const PHASE_CLOSED: u8 = 1;
    const PHASE_LIQUIDITY_BOOTSTRAPPED: u8 = 2;


    public struct Launchpad<phantom T> has key, store{
        id: UID,
        treasury: TreasuryCap<T>,
        params: LaunchParams,
        state: LaunchState,
        creator: address,
        platform_admin: address,
        funding_balance: Balance<USDC>, // Stores collected USDC
        vesting_start_epoch: u64,
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

    /// Create a new Launchpad instance with the specified parameters.
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
        platform_admin: address,
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
            b"Token created from Bondcraft", // Description
            option::none(), // Icon URL
            ctx
        );

        // Freeze the CoinMetadata to make it immutable and publicly accessible
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
            creator: tx_context::sender(ctx),
            platform_admin,
            funding_balance: balance::zero<USDC>(),
            vesting_start_epoch: 0,
        }

    }


    // ============== WRITE METHODS =================
    #[allow(lint(self_transfer))]
    public fun buy_tokens<T>(
        launchpad: &mut Launchpad<T>,
        payment: Coin<USDC>,
        amount: u64,
        ctx: &mut TxContext
    ){
        assert!(launchpad.state.phase == PHASE_OPEN, EINVALID_PHASE);
        assert!(
            launchpad.state.tokens_sold + amount <= launchpad.params.funding_tokens,
            EINSUFFICIENT_TOKENS
        );

        // Calculate required payment based on bonding curve
        let current_price = bonding_curve::calculate_price(launchpad.state.tokens_sold, launchpad.params.k);
        let total_cost = current_price * amount;
        assert!(coin::value(&payment) >= total_cost, EINSUFFICIENT_PAYMENT);

        // Store payment in funding_balance
        coin::put(&mut launchpad.funding_balance, payment);

        // Mint and transfer tokens to buyer
        let minted = coin::mint(&mut launchpad.treasury, amount, ctx);
        transfer::public_transfer(minted, tx_context::sender(ctx));

        // Update tokens sold
        launchpad.state.tokens_sold = launchpad.state.tokens_sold + amount;

        // Check if funding goal is reached
        if (balance::value(&launchpad.funding_balance) >= launchpad.params.funding_goal) {
            launchpad.state.phase = PHASE_CLOSED;
            launchpad.vesting_start_epoch = tx_context::epoch(ctx);
        };
    }


    /// Close the funding phase (only callable by creator).
    public fun close_funding<T>(
        launchpad: &mut Launchpad<T>,
        ctx: &mut TxContext
    ){
        assert!(launchpad.creator == tx_context::sender(ctx), EUNAUTHORIZED);
        assert!(launchpad.state.phase == PHASE_OPEN, EINVALID_PHASE);

        launchpad.state.phase = PHASE_CLOSED;
        launchpad.vesting_start_epoch = tx_context::epoch(ctx);
    }
    

    /// Bootstrapping liquidity by transferring liquidity tokens and funding tokens to an AMM pool
    public fun bootstrap_liquidity<T>(
        launchpad: &mut Launchpad<T>,
        ctx: &mut TxContext
    ){
        assert!(launchpad.creator == tx_context::sender(ctx), EUNAUTHORIZED);
        assert!(launchpad.state.phase == PHASE_CLOSED, EINVALID_PHASE);

        // Mint liquidity tokens
        let liquidity_amount = launchpad.params.liquidity_tokens;
        let liquidity_coins = coin::mint(&mut launchpad.treasury, liquidity_amount, ctx);

        // Extract funding tokens from balance
        let funding_amount = balance::value(&launchpad.funding_balance);
        let funding_coins = coin::take(&mut launchpad.funding_balance, funding_amount, ctx);

        // If Cetus is used: Transfer to Cetus AMM pool
        // transfer::public_transfer(liquidity_coins, amm_pool_address);
        // transfer::public_transfer(funding_coins, amm_pool_address);


        //TODO: Replace with actual AMM pool address like Cetus
        transfer::public_transfer(liquidity_coins, launchpad.creator);
        transfer::public_transfer(funding_coins, launchpad.creator);

        // Update phase
        launchpad.state.phase = PHASE_LIQUIDITY_BOOTSTRAPPED;
    }

    /// Claim creator tokens (with basic vesting: all tokens claimable after funding closes).
    public fun claim_creator_tokens<T>(
        launchpad: &mut Launchpad<T>,
        ctx: &mut TxContext
    ) {
        assert!(launchpad.creator == tx_context::sender(ctx), EUNAUTHORIZED);
        assert!(launchpad.state.phase >= PHASE_CLOSED, EINVALID_PHASE);
        assert!(launchpad.vesting_start_epoch > 0, EVESTING_NOT_READY);

        let creator_amount = launchpad.params.creator_tokens;
        let creator_coins = coin::mint(&mut launchpad.treasury, creator_amount, ctx);
        transfer::public_transfer(creator_coins, launchpad.creator);

        // Setting creator_tokens to 0 to prevent re-claiming
        launchpad.params.creator_tokens = 0;
    }

    /// Claim platform tokens (callable by platform admin, assuming creator for simplicity).
    public fun claim_platform_tokens<T>(
        launchpad: &mut Launchpad<T>,
        ctx: &mut TxContext
    ) {
        assert!(launchpad.platform_admin == tx_context::sender(ctx), EUNAUTHORIZED);
        assert!(launchpad.state.phase >= PHASE_CLOSED, EINVALID_PHASE);

        let platform_amount = launchpad.params.platform_tokens;
        let platform_coins = coin::mint(&mut launchpad.treasury, platform_amount, ctx);

        // Transfer platform tokens to the platform admin
        transfer::public_transfer(platform_coins, launchpad.platform_admin);

        // Set platform_tokens to 0 to prevent re-claiming
        launchpad.params.platform_tokens = 0;
    }

    /// Withdraw collected funding tokens (callable by creator).
    public fun withdraw_funding<T>(
        launchpad: &mut Launchpad<T>,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(launchpad.creator == tx_context::sender(ctx), EUNAUTHORIZED);
        assert!(launchpad.state.phase >= PHASE_CLOSED, EINVALID_PHASE);
        assert!(balance::value(&launchpad.funding_balance) >= amount, EINSUFFICIENT_TOKENS);

        let funding_coins = coin::take(&mut launchpad.funding_balance, amount, ctx);
        transfer::public_transfer(funding_coins, launchpad.creator);
    }


    // =================== READ METHODS ==================

    /// Get the total token supply of the launchpad.
    public fun total_supply<T>(launchpad: &Launchpad<T>): u64 
    {
        launchpad.params.total_supply
    }

    /// Get the number of tokens allocated for funding.
    public fun funding_tokens<T>(launchpad: &Launchpad<T>): u64 {
        launchpad.params.funding_tokens
    }

    /// Get the number of tokens allocated for the creator.
    public fun creator_tokens<T>(launchpad: &Launchpad<T>): u64 {
        launchpad.params.creator_tokens
    }

    /// Get the number of tokens allocated for liquidity.
    public fun liquidity_tokens<T>(launchpad: &Launchpad<T>): u64 {
        launchpad.params.liquidity_tokens
    }

    /// Get the number of tokens allocated for the platform.
    public fun platform_tokens<T>(launchpad: &Launchpad<T>): u64 {
        launchpad.params.platform_tokens
    }

    /// Get the funding goal in funding tokens (e.g., USDC).
    public fun funding_goal<T>(launchpad: &Launchpad<T>): u64 {
        launchpad.params.funding_goal
    }

    /// Get the bonding curve steepness factor (k).
    public fun k<T>(launchpad: &Launchpad<T>): u64 {
        launchpad.params.k
    }

    /// Get the number of tokens sold so far.
    public fun tokens_sold<T>(launchpad: &Launchpad<T>): u64 {
        launchpad.state.tokens_sold
    }

    /// Get the current phase of the launchpad (0 = Open, 1 = Closed, 2 = Liquidity Bootstrapped).
    public fun phase<T>(launchpad: &Launchpad<T>): u8 {
        launchpad.state.phase
    }

    /// Get the creator's address.
    public fun creator<T>(launchpad: &Launchpad<T>): address {
        launchpad.creator
    }

    /// Get the current token price based on the bonding curve.
    public fun current_price<T>(launchpad: &Launchpad<T>): u64 {
        bonding_curve::calculate_price(launchpad.state.tokens_sold, launchpad.params.k)
    }

    /// Get the amount of funding tokens collected.
    public fun funding_balance<T>(launchpad: &Launchpad<T>): u64 {
        balance::value(&launchpad.funding_balance)
    }

    /// Get the vesting start epoch.
    public fun vesting_start_epoch<T>(launchpad: &Launchpad<T>): u64 {
        launchpad.vesting_start_epoch
    }

    /// Get the platform admin .
    public fun platform_admin<T>(launchpad: &Launchpad<T>): address {
        launchpad.platform_admin
    }

}