import { runtimeMethod, RuntimeModule, runtimeModule, state } from "@proto-kit/module";
import { inject } from "tsyringe";
import { Balances } from "./balances";
import { State, StateMap } from "@proto-kit/protocol";
import { TokenId } from "@proto-kit/library";
import { Bool, Field, PublicKey, Struct, UInt64 as o1ui64 } from "o1js";

export class LimitOrder extends Struct({
    tokenIn: TokenId,
    tokenOut: TokenId,
    tokenInAmount: Field,
    tokenOutAmount: Field,
    owner: PublicKey,
    expiration: o1ui64,
    isActive: Bool,
}) {
    public static from(
        tokenIn: TokenId,
        tokenOut: TokenId,
        tokenInAmount: Field,
        tokenOutAmount: Field,
        owner: PublicKey,
        expiration: o1ui64,
        isActive: Bool = Bool(true)
    ) {
        return new LimitOrder({
            tokenIn,
            tokenOut,
            tokenInAmount,
            tokenOutAmount,
            owner,
            expiration,
            isActive,
        });
    }
}

@runtimeModule()
export class LimitOrders extends RuntimeModule<{}> {
    @state() public orderNonce = State.from<Field>(Field);
    @state() public orders = StateMap.from<Field, LimitOrder>(Field, LimitOrder);

    public constructor(@inject("Balances") private balances: Balances) {
        super();
    }

    @runtimeMethod()
    public async createLimitOrder() {}

    @runtimeMethod()
    public async cancelLimitOrder() {}
}
