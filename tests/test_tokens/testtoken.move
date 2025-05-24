#[test_only]
module bond_craft::testtoken;

use sui::coin;

public struct TESTTOKEN has drop {}

fun init(witness: TESTTOKEN, ctx: &mut TxContext) {
    let (treasury_cap, metadata) = coin::create_currency<TESTTOKEN>(
        witness,
        9,
        b"TST",
        b"Test Token",
        b"Test Token for testing purposes",
        option::none(),
        ctx,
    );

    transfer::public_transfer(metadata, tx_context::sender(ctx));
    transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
}

public fun test_init(ctx: &mut TxContext) {
    init(TESTTOKEN {}, ctx);
}