import { runtimeMethod, RuntimeModule, runtimeModule, state } from "@proto-kit/module";
import { inject } from "tsyringe";
import { Balances } from "./balances";
import { Field, Poseidon, Provable, PublicKey, Struct } from "o1js";
import { assert, State, StateMap } from "@proto-kit/protocol";
import { Balance, TokenId } from "@proto-kit/library";

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

@runtimeModule()
export class PoolModule extends RuntimeModule<{}> {
    @state() public pools = StateMap.from<Field, Pool>(Field, Pool);
    @state() public poolCount = State.from(Field);
    public constructor(@inject("Balances") private balances: Balances) {
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

        // todo
        await this.balances.transfer(tokenA, requester, poolAccount, tokenAmountA);
        await this.balances.transfer(tokenB, requester, poolAccount, tokenAmountB);
    }

    @runtimeMethod()
    public async addLiquidity() {}

    @runtimeMethod()
    public async removeLiquidity() {}
}
