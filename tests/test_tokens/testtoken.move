#[test_only]
module bond_craft::testtoken;

use sui::coin;

public struct TESTTOKEN has drop {}

fun init(witness: TESTTOKEN, ctx: &mut TxContext) {
    let (treasury_cap, metadata) = coin::create_currency<TESTTOKEN>(
        witness,
        6,
        vector[],
        vector[],
        vector[],
        option::none(),
        ctx,
    );

    transfer::public_transfer(metadata, tx_context::sender(ctx));
    transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
}

public fun test_init(ctx: &mut TxContext) {
    init(TESTTOKEN {}, ctx);
}