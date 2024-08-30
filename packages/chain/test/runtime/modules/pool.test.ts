import "reflect-metadata";
import { TestingAppChain } from "@proto-kit/sdk";
import { PoolModule } from "../../../src/runtime/modules/pool";
import { log } from "@proto-kit/common";
import { PrivateKey } from "o1js";
import { BalancesKey, TokenId, UInt64 } from "@proto-kit/library";
import { Balances } from "../../../src/runtime/modules/balances";
import { LimitOrders } from "../../../src/runtime/modules/limit-orders";

log.setLevel("ERROR");

describe("pool", () => {
    it("should demonstrate how pool works", async () => {
        const appChain = TestingAppChain.fromRuntime({
            PoolModule,
            Balances,
            LimitOrders,
        });

        appChain.configurePartial({
            Runtime: {
                Balances: {
                    totalSupply: UInt64.from(10000),
                },
                PoolModule: {},
                LimitOrders: {},
            },
        });

        await appChain.start();

        const alicePrivateKey = PrivateKey.random();
        const alice = alicePrivateKey.toPublicKey();
        const token1Id = TokenId.from(0);
        const token2Id = TokenId.from(1);
        appChain.setSigner(alicePrivateKey);

        const pool = appChain.runtime.resolve("PoolModule");
        const balances = appChain.runtime.resolve("Balances");

        const tx1 = await appChain.transaction(alice, async () => {
            await balances.mintToken(token1Id, alice, UInt64.from(1000));
        });

        await tx1.sign();
        await tx1.send();

        const block = await appChain.produceBlock();

        const key = new BalancesKey({ tokenId: token1Id, address: alice });
        const balance = await appChain.query.runtime.Balances.balances.get(key);

        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(balance?.toBigInt()).toBe(1000n);

        const tx2 = await appChain.transaction(alice, async () => {
            await balances.mintToken(token2Id, alice, UInt64.from(1000));
        });

        await tx2.sign();
        await tx2.send();

        const block2 = await appChain.produceBlock();

        const key2 = new BalancesKey({ tokenId: token2Id, address: alice });
        const balance2 = await appChain.query.runtime.Balances.balances.get(key2);

        expect(block2?.transactions[0].status.toBoolean()).toBe(true);
        expect(balance2?.toBigInt()).toBe(1000n);

        const tx3 = await appChain.transaction(alice, async () => {
            await pool.createPool(
                token1Id,
                token2Id,
                UInt64.from(200),
                UInt64.from(200),
                alice,
                UInt64.from(200)
            );
        });

        await tx3.sign();
        await tx3.send();

        const block3 = await appChain.produceBlock();

        expect(block3?.transactions[0].status.toBoolean()).toBe(true);
    });
});
