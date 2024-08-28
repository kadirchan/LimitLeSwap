import { runtimeMethod, RuntimeModule, runtimeModule, state } from "@proto-kit/module";
import { inject } from "tsyringe";
import { Balances } from "./balances";
import { assert, State, StateMap } from "@proto-kit/protocol";
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

export class UserTokenKey extends Struct({
    tokenId: TokenId,
    owner: PublicKey,
}) {
    public static from(tokenId: TokenId, owner: PublicKey) {
        return new UserTokenKey({
            tokenId,
            owner,
        });
    }
}

@runtimeModule()
export class LimitOrders extends RuntimeModule<{}> {
    @state() public orderNonce = State.from<Field>(Field);
    @state() public orders = StateMap.from<Field, LimitOrder>(Field, LimitOrder);
    @state() public captivedAmount = StateMap.from<UserTokenKey, Field>(UserTokenKey, Field);

    public constructor(@inject("Balances") private balances: Balances) {
        super();
    }

    @runtimeMethod()
    public async createLimitOrder(
        tokenIn: TokenId,
        tokenOut: TokenId,
        tokenInAmount: Field,
        tokenOutAmount: Field,
        expiration: o1ui64
    ): Promise<void> {
        const sender = this.transaction.sender.value;
        const senderBalance = await this.balances.getBalance(tokenIn, sender);
        // prevent unlimited orders
        const captivedAmount = await this.captivedAmount.get(UserTokenKey.from(tokenIn, sender));
        const senderAvailableBalance = senderBalance.value.sub(captivedAmount.value);
        const currentBlock = this.network.block.height;
        const expirationBlock = expiration.add(currentBlock);

        assert(tokenInAmount.greaterThan(0), "Amount must be greater than 0");

        assert(
            senderAvailableBalance.greaterThanOrEqual(tokenInAmount),
            "Insufficient balance to create limit order"
        );

        const nonce = await this.orderNonce.get();

        const order = LimitOrder.from(
            tokenIn,
            tokenOut,
            tokenInAmount,
            tokenOutAmount,
            sender,
            expirationBlock
        );

        const newCaptivedAmount = captivedAmount.value.add(tokenInAmount);

        await this.orders.set(nonce.value, order);
        await this.orderNonce.set(nonce.value.add(1));

        await this.captivedAmount.set(UserTokenKey.from(tokenIn, sender), newCaptivedAmount);
    }

    @runtimeMethod()
    public async cancelLimitOrder(orderId: Field) {
        const sender = this.transaction.sender.value;
        const order = await this.orders.get(orderId);
        assert(order.value.owner.equals(sender), "Only the owner can cancel the order");
        assert(order.value.isActive, "Order is already canceled");

        const captivedAmount = await this.captivedAmount.get(
            UserTokenKey.from(order.value.tokenIn, sender)
        );
        const newCaptivedAmount = captivedAmount.value.add(order.value.tokenInAmount);

        await this.captivedAmount.set(
            UserTokenKey.from(order.value.tokenIn, sender),
            newCaptivedAmount
        );

        order.value.isActive = Bool(false);

        await this.orders.set(orderId, order.value);
    }
}
