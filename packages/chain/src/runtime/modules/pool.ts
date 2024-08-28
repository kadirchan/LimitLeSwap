import { runtimeMethod, RuntimeModule, runtimeModule, state } from "@proto-kit/module";
import { inject } from "tsyringe";
import { Balances } from "./balances";
import { Bool, Field, Poseidon, Provable, PublicKey, Struct } from "o1js";
import { assert, State, StateMap } from "@proto-kit/protocol";
import { Balance, TokenId, UInt64 } from "@proto-kit/library";
import { LimitOrders } from "./limit-orders";

export class Pool extends Struct({
    tokenA: TokenId,
    tokenB: TokenId,
    tokenAmountA: Balance,
    tokenAmountB: Balance,
}) {
    public static from(
        tokenA: TokenId,
        tokenB: TokenId,
        tokenAmountA: Balance,
        tokenAmountB: Balance
    ) {
        return new Pool({
            tokenA,
            tokenB,
            tokenAmountA,
            tokenAmountB,
        });
    }

    public static getPoolId(tokenA: TokenId, tokenB: TokenId) {
        return Poseidon.hash([tokenA, tokenB]);
    }
}

const ORDER_BUNDLE = 10;
class OrderBundle extends Struct({
    bundle: Provable.Array(Field, ORDER_BUNDLE),
}) {
    public static empty(): OrderBundle {
        const bundle = Array<Field>(10).fill(Field.from(0));
        return new OrderBundle({ bundle });
    }
}

@runtimeModule()
export class PoolModule extends RuntimeModule<{}> {
    @state() public pools = StateMap.from<Field, Pool>(Field, Pool);
    @state() public poolIds = StateMap.from<Field, Field>(Field, Field);
    @state() public poolCount = State.from(Field);
    public constructor(
        @inject("Balances") private balances: Balances,
        @inject("LimitOrders") private limitOrders: LimitOrders
    ) {
        super();
    }

    @runtimeMethod()
    public async createPool(
        tokenA: TokenId,
        tokenB: TokenId,
        tokenAmountA: Balance,
        tokenAmountB: Balance,
        requester: PublicKey,
        lp_requested: Balance
    ) {
        // deterministic hash needed to generate pool id
        const smallerTokenId = Provable.if(tokenA.lessThan(tokenB), tokenA, tokenB);
        const largerTokenId = Provable.if(tokenA.lessThan(tokenB), tokenB, tokenA);
        const poolId = Poseidon.hash([smallerTokenId, largerTokenId]);
        const poolAccount = PublicKey.fromGroup(
            Poseidon.hashToGroup([poolId, smallerTokenId, largerTokenId])
        );
        const currentPool = await this.pools.get(poolId);
        assert(currentPool.isSome.not(), "Pool already exists");
        assert(tokenA.equals(tokenB).not(), "Tokens must be different");
        const pool = Pool.from(tokenA, tokenB, tokenAmountA, tokenAmountB);
        const requesterBalanceA = await this.balances.getBalance(tokenA, requester);
        assert(requesterBalanceA.greaterThanOrEqual(tokenAmountA));
        const requesterBalanceB = await this.balances.getBalance(tokenB, requester);
        assert(requesterBalanceB.greaterThanOrEqual(tokenAmountB));
        await this.balances.transfer(tokenA, requester, poolAccount, tokenAmountA);
        await this.balances.transfer(tokenB, requester, poolAccount, tokenAmountB);
        // what if overflow?
        const lp_amount_threshold = tokenAmountA.mul(tokenAmountB);
        const requested_square = lp_requested.mul(lp_requested);
        assert(lp_amount_threshold.greaterThanOrEqual(requested_square));
        await this.balances.mintToken(poolId, this.transaction.sender.value, lp_requested);
        await this.pools.set(poolId, pool);

        const currentCount = await this.poolCount.get();
        await this.poolIds.set(currentCount.value, poolId);
        await this.poolCount.set(Field.from(currentCount.value.add(1)));
    }

    @runtimeMethod()
    public async addLiquidity(
        tokenA: TokenId,
        tokenB: TokenId,
        tokenAmountA: Balance,
        tokenAmountB: Balance,
        lpRequested: Balance
    ) {
        const smallerTokenId = Provable.if(tokenA.lessThan(tokenB), tokenA, tokenB);
        const largerTokenId = Provable.if(tokenA.lessThan(tokenB), tokenB, tokenA);
        const poolId = Poseidon.hash([smallerTokenId, largerTokenId]);
        const pool = await this.pools.get(poolId);
        assert(pool.isSome, "Pool does not exist");
        assert(lpRequested.greaterThan(Balance.from(0)), "LP tokens must be greater than 0");

        const poolAccount = PublicKey.fromGroup(
            Poseidon.hashToGroup([poolId, smallerTokenId, largerTokenId])
        );

        const lpTotal = await this.balances.getCirculatingSupply(poolId);

        assert(lpTotal.greaterThan(Balance.from(0)), "Pool is empty");

        const reserveA = await this.balances.getBalance(tokenA, poolAccount);
        const reserveB = await this.balances.getBalance(tokenB, poolAccount);

        assert(tokenAmountA.mul(reserveB).equals(tokenAmountB.mul(reserveA)), "Invalid ratio");

        Provable.asProver(() => {
            console.log("reserveA", reserveA.toString());
            console.log("reserveB", reserveB.toString());
            console.log("tokenAmountA", tokenAmountA.toString());
            console.log("tokenAmountB", tokenAmountB.toString());
            console.log(tokenAmountA.mul(reserveB).toString());
            console.log(tokenAmountB.mul(reserveA).toString());
            console.log(tokenAmountA.mul(reserveB).equals(tokenAmountB.mul(reserveA)).toBoolean());
        });
        const lpSquare = lpRequested.mul(lpRequested);

        assert(lpSquare.lessThanOrEqual(tokenAmountA.mul(tokenAmountB)), "Invalid LP token amount");

        await this.balances.transfer(
            tokenA,
            this.transaction.sender.value,
            poolAccount,
            tokenAmountA
        );
        await this.balances.transfer(
            tokenB,
            this.transaction.sender.value,
            poolAccount,
            tokenAmountB
        );
        await this.balances.mintToken(poolId, this.transaction.sender.value, lpRequested);

        const updatedPool = Pool.from(
            tokenA,
            tokenB,
            reserveA.add(tokenAmountA),
            reserveB.add(tokenAmountB)
        );
        await this.pools.set(poolId, updatedPool);
    }

    @runtimeMethod()
    public async removeLiquidity(
        tokenA: TokenId,
        tokenB: TokenId,
        requestedA: Balance,
        requestedB: Balance,
        lpBurned: Balance
    ) {
        const smallerTokenId = Provable.if(tokenA.lessThan(tokenB), tokenA, tokenB);
        const largerTokenId = Provable.if(tokenA.lessThan(tokenB), tokenB, tokenA);
        const poolId = Poseidon.hash([smallerTokenId, largerTokenId]);
        const pool = await this.pools.get(poolId);
        assert(pool.isSome, "Pool does not exist");

        const poolAccount = PublicKey.fromGroup(
            Poseidon.hashToGroup([poolId, smallerTokenId, largerTokenId])
        );

        const reserveA = await this.balances.getBalance(tokenA, poolAccount);
        const reserveB = await this.balances.getBalance(tokenB, poolAccount);

        const senderLp = await this.balances.getBalance(poolId, this.transaction.sender.value);

        const lpTotal = await this.balances.getCirculatingSupply(poolId);

        assert(senderLp.greaterThanOrEqual(lpBurned), "Not enough LP tokens");

        assert(requestedA.lessThanOrEqual(reserveA), "Not enough token A");
        assert(requestedB.lessThanOrEqual(reserveB), "Not enough token B");

        assert(requestedA.mul(lpTotal).lessThanOrEqual(senderLp.mul(reserveA)));
        assert(requestedB.mul(lpTotal).lessThanOrEqual(senderLp.mul(reserveB)));

        await this.balances.burnToken(poolId, this.transaction.sender.value, lpBurned);
        await this.balances.transfer(
            tokenA,
            poolAccount,
            this.transaction.sender.value,
            requestedA
        );
        await this.balances.transfer(
            tokenB,
            poolAccount,
            this.transaction.sender.value,
            requestedB
        );

        const updatedPool = Pool.from(
            tokenA,
            tokenB,
            reserveA.sub(requestedA),
            reserveB.sub(requestedB)
        );
        await this.pools.set(poolId, updatedPool);
    }

    @runtimeMethod()
    public async rawSwap(
        tokenIn: TokenId,
        tokenOut: TokenId,
        amountIn: Balance,
        amountOut: Balance
    ) {
        assert(amountIn.greaterThan(Balance.from(0)), "AmountIn must be greater than 0");
        assert(amountOut.greaterThan(Balance.from(0)), "AmountOut must be greater than 0");

        const smallerTokenId = Provable.if(tokenIn.lessThan(tokenOut), tokenIn, tokenOut);
        const largerTokenId = Provable.if(tokenIn.lessThan(tokenOut), tokenOut, tokenIn);
        const poolId = Poseidon.hash([smallerTokenId, largerTokenId]);
        const pool = await this.pools.get(poolId);
        assert(pool.isSome, "Pool does not exist");

        const poolAccount = PublicKey.fromGroup(
            Poseidon.hashToGroup([poolId, smallerTokenId, largerTokenId])
        );

        const senderBalance = await this.balances.getBalance(
            tokenIn,
            this.transaction.sender.value
        );
        assert(senderBalance.greaterThanOrEqual(amountIn), "Not enough token to swap");

        let reserveIn = await this.balances.getBalance(tokenIn, poolAccount);
        let reserveOut = await this.balances.getBalance(tokenOut, poolAccount);

        Provable.asProver(() => {
            console.log("reserveIn", reserveIn.toString());
            console.log("reserveOut", reserveOut.toString());
            console.log("amountIn", amountIn.toString());
            console.log("amountOut", amountOut.toString());
        });
        const kPrev = reserveIn.mul(reserveOut);

        Provable.asProver(() => {
            console.log("kPrev", kPrev.toString());
        });

        assert(amountOut.lessThanOrEqual(reserveOut), "Not enough token in pool");

        Provable.asProver(() => {
            console.log("first way", amountIn.mul(997n).div(1000n).add(reserveIn));
            console.log("second way", amountIn.div(1000n).mul(997n).add(reserveIn));
        });

        const adjustedReserveIn = amountIn.mul(997n).div(1000n).add(reserveIn);
        const adjustedReserveOut = reserveOut.sub(amountOut);

        Provable.asProver(() => {
            console.log("adjustedReserveIn", adjustedReserveIn.toString());
            console.log("adjustedReserveOut", adjustedReserveOut.toString());
        });

        const k = adjustedReserveIn.mul(adjustedReserveOut);

        Provable.asProver(() => {
            console.log("k", k.toString());
            console.log("kPrev", kPrev.toString());
            console.log("k > kPrev", k.greaterThanOrEqual(kPrev).toBoolean());
        });

        assert(k.greaterThanOrEqual(kPrev), "Invalid swap");

        await this.balances.transfer(tokenIn, this.transaction.sender.value, poolAccount, amountIn);
        await this.balances.transfer(
            tokenOut,
            poolAccount,
            this.transaction.sender.value,
            amountOut
        );

        reserveIn = await this.balances.getBalance(tokenIn, poolAccount);
        reserveOut = await this.balances.getBalance(tokenOut, poolAccount);

        const adjustedPool = Pool.from(tokenIn, tokenOut, reserveIn, reserveOut);
        await this.pools.set(poolId, adjustedPool);
    }

    @runtimeMethod()
    public async swapWithLimit(
        tokenIn: TokenId,
        tokenOut: TokenId,
        amountIn: Balance,
        amountOut: Balance,
        limitOrders: OrderBundle
    ) {
        const smallerTokenId = Provable.if(tokenIn.lessThan(tokenOut), tokenIn, tokenOut);
        const largerTokenId = Provable.if(tokenIn.lessThan(tokenOut), tokenOut, tokenIn);
        const poolId = Poseidon.hash([smallerTokenId, largerTokenId]);
        const pool = await this.pools.get(poolId);
        assert(pool.isSome, "Pool does not exist");
        const senderBalance = await this.balances.getBalance(
            tokenIn,
            this.transaction.sender.value
        );
        assert(senderBalance.greaterThanOrEqual(amountIn), "Not enough token to swap");

        let remainingAmountIn = amountIn;
        let limitOrderFills = Balance.from(0);

        for (let i = 0; i < 10; i++) {
            const limitOrderId = limitOrders.bundle[i];
            assert(limitOrderId.greaterThanOrEqual(Field.from(0)), "Invalid limit order id");
            const order = (await this.limitOrders.orders.get(limitOrderId)).value;
            let isActive = order.isActive.and(
                order.expiration.greaterThanOrEqual(this.network.block.height)
            );
            Provable.asProver(() => {
                console.log("order", limitOrderId.toString());
                console.log("isActive", isActive.toBoolean());
            });
            assert(order.tokenOut.equals(tokenIn).or(isActive.not()), "Invalid token out");
            assert(order.tokenIn.equals(tokenOut).or(isActive.not()), "Invalid token in");

            Provable.asProver(() => {
                console.log("orderTokenOutAmount", order.tokenOutAmount.toString());
                console.log(
                    "orderTokenOutAmount",
                    UInt64.Unsafe.fromField(order.tokenOutAmount).toString()
                );
                console.log("orderTokenInAmount", order.tokenInAmount.toString());
                console.log(
                    "orderTokenInAmount",
                    UInt64.Unsafe.fromField(order.tokenInAmount).toString()
                );
            });

            const amountToFill = UInt64.Unsafe.fromField(
                Provable.if(isActive, order.tokenOutAmount, Field.from(0))
            );
            const amountToTake = UInt64.Unsafe.fromField(
                Provable.if(isActive, order.tokenInAmount, Field.from(0))
            );
            remainingAmountIn = Balance.from(remainingAmountIn.sub(amountToFill));
            limitOrderFills = Balance.from(limitOrderFills.add(amountToTake));
            Provable.asProver(() => {
                console.log("amountToFill", amountToFill.toString());
                console.log("amountToTake", amountToTake.toString());
                console.log("remainingAmountIn", remainingAmountIn.toString());
                console.log("limitOrderFills", limitOrderFills.toString());
            });
            await this.balances.transfer(
                tokenIn,
                this.transaction.sender.value,
                order.owner,
                Balance.from(amountToFill)
            );
            await this.balances.transfer(
                tokenOut,
                order.owner,
                this.transaction.sender.value,
                Balance.from(amountToTake)
            );
            order.isActive = Bool(false);
            await this.limitOrders.orders.set(limitOrderId, order);
        }
        const remainingAmountOut = amountOut.sub(limitOrderFills);
        Provable.asProver(() => {
            console.log("final remainingAmountIn", remainingAmountIn.toString());
            console.log("final remainingAmountOut", remainingAmountOut.toString());
        });
        await this.rawSwap(tokenIn, tokenOut, remainingAmountIn, remainingAmountOut);
    }
}
