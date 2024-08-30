import { TestingAppChain } from "@proto-kit/sdk";
import { method, PrivateKey } from "o1js";
import { Balances } from "../../../src/runtime/modules/balances";
import { log } from "@proto-kit/common";
import { BalancesKey, TokenId, UInt64 } from "@proto-kit/library";

log.setLevel("ERROR");

describe("balances", () => {
    it("should demonstrate how balances work", async () => {
        const appChain = TestingAppChain.fromRuntime({
            Balances,
        });

        appChain.configurePartial({
            Runtime: {
                Balances: {
                    totalSupply: UInt64.from(10000),
                },
            },
        });

        await appChain.start();

        const alicePrivateKey = PrivateKey.random();
        const alice = alicePrivateKey.toPublicKey();
        const tokenId = TokenId.from(0);

        appChain.setSigner(alicePrivateKey);

        const balances = appChain.runtime.resolve("Balances");

        const tx1 = await appChain.transaction(alice, async () => {
            await balances.mintToken(tokenId, alice, UInt64.from(1000));
        });

        await tx1.sign();
        await tx1.send();

        const block = await appChain.produceBlock();

        const key = new BalancesKey({ tokenId, address: alice });
        const balance = await appChain.query.runtime.Balances.balances.get(key);

        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(balance?.toBigInt()).toBe(1000n);
    }, 1_000_000);

    it("burn Token method", async () => {
        const appChain = TestingAppChain.fromRuntime({
            Balances,
        });

        appChain.configurePartial({
            Runtime: {
                Balances: {
                    totalSupply: UInt64.from(10000),
                },
            },
        });

        await appChain.start();

        const alicePrivateKey = PrivateKey.random();
        const alice = alicePrivateKey.toPublicKey();
        const tokenId = TokenId.from(0);

        appChain.setSigner(alicePrivateKey);

        const balances = appChain.runtime.resolve("Balances");

        const tx1 = await appChain.transaction(alice, async () => {
            await balances.mintToken(tokenId, alice, UInt64.from(1000));
        });

        await tx1.sign();
        await tx1.send();

        const block = await appChain.produceBlock();

        const tx2 = await appChain.transaction(alice, async () => {
            await balances.burnToken(tokenId, alice, UInt64.from(500));
        });

        await tx2.sign();
        await tx2.send();

        const block2 = await appChain.produceBlock();

        const key = new BalancesKey({ tokenId, address: alice });
        const balance = await appChain.query.runtime.Balances.balances.get(key);

        expect(block2?.transactions[0].status.toBoolean()).toBe(true);
        expect(balance?.toBigInt()).toBe(500n);
    });
});
