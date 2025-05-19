module bond_craft::coin_template {
    use sui::coin;

    public struct COIN_TEMPLATE has drop {}

    const DECIMALS: u8 = 0;
    const SYMBOL: vector<u8> = b"TMPL";
    const NAME: vector<u8> = b"Template Coin";
    const DESCRIPTION: vector<u8> = b"Template Coin Description";

    fun init(witness: COIN_TEMPLATE, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            witness, DECIMALS, SYMBOL, NAME, DESCRIPTION, option::none(), ctx
        );
        transfer::public_freeze_object(metadata);
        transfer::public_transfer(metadata, tx_context::sender(ctx));
        transfer::public_transfer(treasury, tx_context::sender(ctx));
    }
}
