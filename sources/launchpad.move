module bond_craft::launchpad{
    use sui::coin::{Self, Coin, CoinMetadata, TreasuryCap};
    use sui::balance::{Self, Balance};
    use std::string;
    use bond_craft::bonding_curve;
    use bond_craft::pool;
    use cetus_clmm::config::GlobalConfig;
    use cetus_clmm::factory::Pools;
    use sui::clock::Clock;
    use sui::event;

    // Testnet USDC type
    use usdc::usdc::USDC;

    // Error codes
    const EInvalidAllocation: u64 = 1;
    const EInvalidName: u64 = 2;
    const EInvalidSymbol: u64 = 3;
    const EInvalidDecimals: u64 = 4;
    const EInvalidFundingGoal: u64 = 5;
    const EInvalidTotalSupply: u64 = 6;
    const EInsufficientPayment: u64 = 7;
    const EInvalidPhase: u64 = 8;
    const EUnauthorized: u64 = 9;
    const EInsufficientTokens: u64 = 10;
    const EVestingNotReady: u64 = 11;
    const EExcessivePurchase: u64 = 12;

    // Phase constants
    const PHASE_OPEN: u8 = 0;
    const PHASE_CLOSED: u8 = 1;
    const PHASE_LIQUIDITY_BOOTSTRAPPED: u8 = 2;

    const MAX_TOKENS_PER_TX: u64 = 1_000_000_000_000_000_000; // 1M tokens, 9 decimals

    // OTW - witness for creating a new token
    public struct LaunchpadWitness has drop {}

    public struct Launchpad has key, store{
        id: UID,
        treasury: TreasuryCap<LaunchpadWitness>,
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

    // Event structs
    public struct LaunchpadCreatedEvent has copy, drop {
        sender: address,
        launchpad_id: address,
        symbol: vector<u8>,
        name: vector<u8>,
        decimals: u8,
        total_supply: u64,
        funding_goal: u64,
        k: u64,
        epoch: u64,
    }

    public struct TokensPurchasedEvent has copy, drop {
        sender: address,
        launchpad_id: address,
        amount: u64,
        total_cost: u64,
        current_price: u64,
        epoch: u64,
    }

    public struct FundingClosedEvent has copy, drop {
        sender: address,
        launchpad_id: address,
        vesting_start_epoch: u64,
        epoch: u64,
    }

    public struct LiquidityBootstrappedEvent has copy, drop {
        sender: address,
        launchpad_id: address,
        final_price: u64,
        epoch: u64,
    }

    public struct CreatorTokensClaimedEvent has copy, drop {
        sender: address,
        launchpad_id: address,
        amount: u64,
        epoch: u64,
    }

    public struct PlatformTokensClaimedEvent has copy, drop {
        sender: address,
        launchpad_id: address,
        amount: u64,
        epoch: u64,
    }

    public struct FundingWithdrawnEvent has copy, drop {
        sender: address,
        launchpad_id: address,
        amount: u64,
        epoch: u64,
    }

    public fun create_witness(_: &TxContext): LaunchpadWitness {
        LaunchpadWitness {}
    }

    /// Create a new Launchpad instance with the specified parameters.
    public fun create(
        ctx: &mut TxContext,
        symbol: vector<u8>,
        name: vector<u8>,
        decimals: u8,
        total_supply: u64,
        funding_tokens: u64,
        creator_tokens: u64,
        liquidity_tokens: u64,
        platform_tokens: u64,
        funding_goal: u64,
        platform_admin: address
    ): Launchpad {
        assert!(
            funding_tokens + creator_tokens + liquidity_tokens + platform_tokens == total_supply,
            EInvalidAllocation
        );
        assert!(&name != vector::empty<u8>(), EInvalidName);
        assert!(&symbol != vector::empty<u8>(), EInvalidSymbol);
        assert!(decimals >= 6, EInvalidDecimals);
        assert!(funding_goal > 0, EInvalidFundingGoal);
        assert!(total_supply > 0, EInvalidTotalSupply);

        let witness = create_witness(ctx);

        let k = bonding_curve::calculate_k(
            funding_goal, 
            6, // USDC has 6 decimals
            funding_tokens,
            decimals, // Project token decimals from function params
            );


        let (treasury, metadata) = coin::create_currency(
            witness,
            decimals,
            symbol,
            name,
            b"Token created from Bondcraft", // Description
            option::none(), // Icon URL
            ctx
        );

        // Freeze the CoinMetadata to make it immutable and publicly accessible
        transfer::public_freeze_object(metadata);

        let launchpad = Launchpad {
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
        };

        // Emit event
        event::emit(LaunchpadCreatedEvent {
            sender: tx_context::sender(ctx),
            launchpad_id: object::uid_to_address(&launchpad.id),
            symbol,
            name,
            decimals,
            total_supply,
            funding_goal,
            k,
            epoch: tx_context::epoch(ctx),
        });

        launchpad

    }


    // ============== WRITE METHODS =================
    #[allow(lint(self_transfer))]
    public fun buy_tokens(
        launchpad: &mut Launchpad,
        payment: Coin<USDC>,
        amount: u64,
        ctx: &mut TxContext
    ){
        assert!(launchpad.state.phase == PHASE_OPEN, EInvalidPhase);
        assert!(
            launchpad.state.tokens_sold + amount <= launchpad.params.funding_tokens,
            EInsufficientTokens
        );
        assert!(amount <= MAX_TOKENS_PER_TX, EExcessivePurchase);

        // Calculate required payment based on bonding curve
        let current_price = bonding_curve::calculate_price(launchpad.state.tokens_sold, 9, launchpad.params.k);
        let total_cost = current_price * amount;
        assert!(coin::value(&payment) >= total_cost, EInsufficientPayment);

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

        // Emit event
        event::emit(TokensPurchasedEvent {
            sender: tx_context::sender(ctx),
            launchpad_id: object::uid_to_address(&launchpad.id),
            amount,
            total_cost,
            current_price,
            epoch: tx_context::epoch(ctx),
        });
    }


    /// Close the funding phase (only callable by creator).
    public fun close_funding(
        launchpad: &mut Launchpad,
        ctx: &mut TxContext
    ){
        assert!(launchpad.creator == tx_context::sender(ctx), EUnauthorized);
        assert!(launchpad.state.phase == PHASE_OPEN, EInvalidPhase);

        launchpad.state.phase = PHASE_CLOSED;
        launchpad.vesting_start_epoch = tx_context::epoch(ctx);

        // Emit event
        event::emit(FundingClosedEvent {
            sender: tx_context::sender(ctx),
            launchpad_id: object::uid_to_address(&launchpad.id),
            vesting_start_epoch: launchpad.vesting_start_epoch,
            epoch: tx_context::epoch(ctx),
        });
    }
    

    /// Bootstrapping liquidity by transferring liquidity tokens and funding tokens to an AMM pool
    public fun bootstrap_liquidity(
        launchpad: &mut Launchpad,
        cetus_config: &GlobalConfig,
        pools: &mut Pools,
        metadata_t: &CoinMetadata<LaunchpadWitness>,
        metadata_usdc: &CoinMetadata<USDC>,
        clock: &Clock,
        ctx: &mut TxContext
    ){
        assert!(launchpad.creator == tx_context::sender(ctx), EUnauthorized);
        assert!(launchpad.state.phase == PHASE_CLOSED, EInvalidPhase);

        // Mint liquidity tokens
        let liquidity_amount = launchpad.params.liquidity_tokens;
        let liquidity_coins = coin::mint(&mut launchpad.treasury, liquidity_amount, ctx);

        // Extract funding tokens from balance
        let funding_amount = balance::value(&launchpad.funding_balance);
        let funding_coins = coin::take(&mut launchpad.funding_balance, funding_amount, ctx);

        // Calculate final price from bonding curve
        let final_price = bonding_curve::calculate_price(launchpad.state.tokens_sold, 9,  launchpad.params.k);

        // Create Cetus pool
        pool::create_pool<LaunchpadWitness, USDC>(
            cetus_config,
            pools,
            liquidity_coins,
            funding_coins,
            final_price,
            500, // 0.05% fee tier
            string::utf8(b"Bondcraft Pool"),
            metadata_t,
            metadata_usdc,
            clock,
            ctx
        );

        // Update phase
        launchpad.state.phase = PHASE_LIQUIDITY_BOOTSTRAPPED;

        // Emit event
        event::emit(LiquidityBootstrappedEvent {
            sender: tx_context::sender(ctx),
            launchpad_id: object::uid_to_address(&launchpad.id),
            final_price,
            epoch: tx_context::epoch(ctx),
        });
    }

    /// Claim creator tokens (with basic vesting: all tokens claimable after funding closes).
    public fun claim_creator_tokens(
        launchpad: &mut Launchpad,
        ctx: &mut TxContext
    ) {
        assert!(launchpad.creator == tx_context::sender(ctx), EUnauthorized);
        assert!(launchpad.state.phase >= PHASE_CLOSED, EInvalidPhase);
        assert!(launchpad.vesting_start_epoch > 0, EVestingNotReady);

        let creator_amount = launchpad.params.creator_tokens;
        let creator_coins = coin::mint(&mut launchpad.treasury, creator_amount, ctx);
        transfer::public_transfer(creator_coins, launchpad.creator);

        // Setting creator_tokens to 0 to prevent re-claiming
        launchpad.params.creator_tokens = 0;

        // Emit event
        event::emit(CreatorTokensClaimedEvent {
            sender: tx_context::sender(ctx),
            launchpad_id: object::uid_to_address(&launchpad.id),
            amount: creator_amount,
            epoch: tx_context::epoch(ctx),
        });
    }

    /// Claim platform tokens (callable by platform admin, assuming creator for simplicity).
    public fun claim_platform_tokens(
        launchpad: &mut Launchpad,
        ctx: &mut TxContext
    ) {
        assert!(launchpad.platform_admin == tx_context::sender(ctx), EUnauthorized);
        assert!(launchpad.state.phase >= PHASE_CLOSED, EInvalidPhase);

        let platform_amount = launchpad.params.platform_tokens;
        let platform_coins = coin::mint(&mut launchpad.treasury, platform_amount, ctx);

        // Transfer platform tokens to the platform admin
        transfer::public_transfer(platform_coins, launchpad.platform_admin);

        // Set platform_tokens to 0 to prevent re-claiming
        launchpad.params.platform_tokens = 0;

        // Emit event
        event::emit(PlatformTokensClaimedEvent {
            sender: tx_context::sender(ctx),
            launchpad_id: object::uid_to_address(&launchpad.id),
            amount: platform_amount,
            epoch: tx_context::epoch(ctx),
        });
    }

    /// Withdraw collected funding tokens (callable by creator).
    public fun withdraw_funding(
        launchpad: &mut Launchpad,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(launchpad.creator == tx_context::sender(ctx), EUnauthorized);
        assert!(launchpad.state.phase >= PHASE_CLOSED, EInvalidPhase);
        assert!(balance::value(&launchpad.funding_balance) >= amount, EInsufficientTokens);

        let funding_coins = coin::take(&mut launchpad.funding_balance, amount, ctx);
        transfer::public_transfer(funding_coins, launchpad.creator);

        // Emit event
        event::emit(FundingWithdrawnEvent {
            sender: tx_context::sender(ctx),
            launchpad_id: object::uid_to_address(&launchpad.id),
            amount,
            epoch: tx_context::epoch(ctx),
        });
    }


    // =================== READ METHODS ==================

    /// Get the total token supply of the launchpad.
    public fun total_supply(launchpad: &Launchpad): u64 
    {
        launchpad.params.total_supply
    }

    /// Get the number of tokens allocated for funding.
    public fun funding_tokens(launchpad: &Launchpad): u64 {
        launchpad.params.funding_tokens
    }

    /// Get the number of tokens allocated for the creator.
    public fun creator_tokens(launchpad: &Launchpad): u64 {
        launchpad.params.creator_tokens
    }

    /// Get the number of tokens allocated for liquidity.
    public fun liquidity_tokens(launchpad: &Launchpad): u64 {
        launchpad.params.liquidity_tokens
    }

    /// Get the number of tokens allocated for the platform.
    public fun platform_tokens(launchpad: &Launchpad): u64 {
        launchpad.params.platform_tokens
    }

    /// Get the funding goal in funding tokens (e.g., USDC).
    public fun funding_goal(launchpad: &Launchpad): u64 {
        launchpad.params.funding_goal
    }

    /// Get the bonding curve steepness factor (k).
    public fun k(launchpad: &Launchpad): u64 {
        launchpad.params.k
    }

    /// Get the number of tokens sold so far.
    public fun tokens_sold(launchpad: &Launchpad): u64 {
        launchpad.state.tokens_sold
    }

    /// Get the current phase of the launchpad (0 = Open, 1 = Closed, 2 = Liquidity Bootstrapped).
    public fun phase(launchpad: &Launchpad): u8 {
        launchpad.state.phase
    }

    /// Get the creator's address.
    public fun creator(launchpad: &Launchpad): address {
        launchpad.creator
    }

    /// Get the current token price based on the bonding curve.
    public fun current_price(launchpad: &Launchpad): u64 {
        bonding_curve::calculate_price(launchpad.state.tokens_sold, 9, launchpad.params.k)
    }

    /// Get the amount of funding tokens collected.
    public fun funding_balance(launchpad: &Launchpad): u64 {
        balance::value(&launchpad.funding_balance)
    }

    /// Get the vesting start epoch.
    public fun vesting_start_epoch(launchpad: &Launchpad): u64 {
        launchpad.vesting_start_epoch
    }

    /// Get the platform admin .
    public fun platform_admin(launchpad: &Launchpad): address {
        launchpad.platform_admin
    }

    // ================== TESTING METHODS ==================
    /// Create a mock launchpad for testing purposes.
    #[test_only]
    public fun create_test(
        ctx: &mut TxContext,
        symbol: vector<u8>,
        name: vector<u8>,
        decimals: u8,
        total_supply: u64,
        funding_tokens: u64,
        creator_tokens: u64,
        liquidity_tokens: u64,
        platform_tokens: u64,
        funding_goal: u64,
        platform_admin: address
    ): Launchpad {

        // Validate inputs
        assert!(
        funding_tokens + creator_tokens + liquidity_tokens + platform_tokens == total_supply,
        EInvalidAllocation
        );
        assert!(&name != vector::empty<u8>(), EInvalidName);
        assert!(&symbol != vector::empty<u8>(), EInvalidSymbol);
        assert!(decimals >= 6, EInvalidDecimals);
        assert!(funding_goal > 0, EInvalidFundingGoal);
        assert!(total_supply > 0, EInvalidTotalSupply);

        // Mock TreasuryCap using test-only function
        let treasury = coin::create_treasury_cap_for_testing<LaunchpadWitness>(ctx);

        let k = bonding_curve::calculate_k(funding_goal, 6, funding_tokens, decimals);

        let launchpad = Launchpad {
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
        };

        // Emit event
        event::emit(LaunchpadCreatedEvent {
            sender: tx_context::sender(ctx),
            launchpad_id: object::uid_to_address(&launchpad.id),
            symbol,
            name,
            decimals,
            total_supply,
            funding_goal,
            k,
            epoch: tx_context::epoch(ctx),
        });

        launchpad
    }

    #[test_only]
    public fun bootstrap_liquidity_test(
        launchpad: &mut Launchpad,
        ctx: &mut TxContext
    ) {
        assert!(launchpad.creator == tx_context::sender(ctx), EUnauthorized);
        assert!(launchpad.state.phase == PHASE_CLOSED, EInvalidPhase);

        // Simulate minting liquidity tokens
        let liquidity_amount = launchpad.params.liquidity_tokens;
        let liquidity_coins = coin::mint(&mut launchpad.treasury, liquidity_amount, ctx);
        transfer::public_transfer(liquidity_coins, tx_context::sender(ctx));

        // Simulate transferring funding tokens
        let funding_amount = balance::value(&launchpad.funding_balance);
        let funding_coins = coin::take(&mut launchpad.funding_balance, funding_amount, ctx);
        transfer::public_transfer(funding_coins, tx_context::sender(ctx));

        // Update phase
        launchpad.state.phase = PHASE_LIQUIDITY_BOOTSTRAPPED;

        // Emit event
        event::emit(LiquidityBootstrappedEvent {
            sender: tx_context::sender(ctx),
            launchpad_id: object::uid_to_address(&launchpad.id),
            final_price: bonding_curve::calculate_price(launchpad.state.tokens_sold, 9, launchpad.params.k),
            epoch: tx_context::epoch(ctx),
        });
    }

}