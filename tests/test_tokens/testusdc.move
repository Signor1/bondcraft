#[test_only]
module bond_craft::testusdc;

use sui::coin;

public struct TESTUSDC has drop {}

fun init(witness: TESTUSDC, ctx: &mut TxContext) {
    let (treasury_cap, metadata) = coin::create_currency<TESTUSDC>(
        witness,
        9,
        b"TESTUSDC",
        b"Test USDC",
        b"Test USDC for testing purposes",
        option::none(),
        ctx,
    );

    transfer::public_transfer(metadata, tx_context::sender(ctx));
    transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
}

public fun test_init(ctx: &mut TxContext) {
    init(TESTUSDC {}, ctx);
}