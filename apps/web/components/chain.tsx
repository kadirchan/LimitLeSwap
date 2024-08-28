import { useClientStore } from "@/lib/stores/client";
import { Pool, Position, Token, usePoolStore } from "@/lib/stores/poolStore";
import { useWalletStore } from "@/lib/stores/wallet";
import { tokens } from "@/lib/tokens";
import { BalancesKey, TokenId } from "@proto-kit/library";
import { Field, PublicKey } from "o1js";
import { useEffect } from "react";

export interface ChainProps {
  height?: string;
}

export function Chain({ height }: ChainProps) {
  const client = useClientStore();
  const poolStore = usePoolStore();
  const walletStore = useWalletStore();
  const { wallet } = walletStore;

  useEffect(() => {
    if (!client.client) return;
    (async () => {
      const tokenList: Token[] = [];

      for (let i = 0; i < 4; i++) {
        const tokenId = await client.client!.query.runtime.Balances.tokens.get(
          Field.from(i),
        );

        // console.log(tokenId?.value[1][1].toString());

        if (!tokenId) {
          continue;
        }
        const token: Token = {
          name: tokens[i].name,
          icon: tokens[i].icon,
          //@ts-ignore
          tokenId: tokenId?.value[1][1].toString(),
        };
        // console.log(token);
        tokenList.push(token);
      }

      // console.log(tokenList);
      poolStore.setTokenList(tokenList);

      const poolCount =
        await client.client!.query.runtime.PoolModule.poolCount.get();

      const poolList: Pool[] = [];
      const positionList: Position[] = [];

      if (poolCount) {
        // console.log(Number(poolCount.toString()));
        for (let i = 0; i < Number(poolCount.toString()); i++) {
          const poolId =
            await client.client!.query.runtime.PoolModule.poolIds.get(
              Field.from(i),
            );
          if (!poolId) {
            return;
          }
          const pool =
            await client.client!.query.runtime.PoolModule.pools.get(poolId);
          if (!pool) {
            return;
          }
          // console.log(pool);
          const token0Id = pool.tokenA.toString();
          const token1Id = pool.tokenB.toString();

          const token0Amount = pool.tokenAmountA.toBigInt().toString();
          const token1Amount = pool.tokenAmountB.toBigInt().toString();

          const lpTokenSupply =
            await client.client!.query.runtime.Balances.circulatingSupply.get(
              TokenId.from(poolId.toString()),
            );

          // console.log(BigInt(token0Id));
          // console.log(BigInt(token1Id));
          // console.log(BigInt(token0Id) < BigInt(token1Id));

          if (BigInt(token0Id) < BigInt(token1Id)) {
            const pool: Pool = {
              poolId: poolId.toString(),
              token0: tokenList.find((token) => token.tokenId === token0Id)!,
              token1: tokenList.find((token) => token.tokenId === token1Id)!,
              token0Amount,
              token1Amount,
              lpTokenSupply: lpTokenSupply?.toString() ?? "0",
            };

            // console.log("31", pool);
            poolList.push(pool);
          } else {
            const smallerTokenId = token1Id;
            // console.log("smallerTokenId", smallerTokenId);
            const smallerToken = tokenList.find(
              (token) => token.tokenId === token1Id,
            );
            // console.log("smallerToken", smallerToken);
            // console.log("smallerTokenAmount", token1Amount);
            const biggerTokenId = token0Id;
            // console.log("biggerTokenId", biggerTokenId);
            const biggerToken = tokenList.find(
              (token) => token.tokenId === token0Id,
            );
            // console.log("biggerToken", biggerToken);
            // console.log("biggerTokenAmount", token0Amount);
            const pool: Pool = {
              poolId: poolId.toString(),
              token0: tokenList.find((token) => token.tokenId === token1Id)!,
              token1: tokenList.find((token) => token.tokenId === token0Id)!,
              token0Amount: token1Amount,
              token1Amount: token0Amount,
              lpTokenSupply: lpTokenSupply?.toString() ?? "0",
            };

            // console.log("52", pool);
            poolList.push(pool);
          }

          if (wallet) {
            const pool = poolList[i];
            const userKey = BalancesKey.from(
              TokenId.from(poolId),
              PublicKey.fromBase58(wallet),
            );
            const userLpBalance =
              await client.client!.query.runtime.Balances.balances.get(userKey);
            if (!userLpBalance || userLpBalance.toString() === "0") {
              continue;
            }

            const position: Position = {
              poolId: poolId,
              token0: pool.token0,
              token1: pool.token1,
              token0Amount: (
                (Number(pool.token0Amount) * Number(userLpBalance.toString())) /
                Number(pool.lpTokenSupply)
              ).toString(),
              token1Amount: (
                (Number(pool.token1Amount) * Number(userLpBalance.toString())) /
                Number(pool.lpTokenSupply)
              ).toString(),
              lpTokenAmount: userLpBalance.toString(),
              lpTokenTotalSupply: pool.lpTokenSupply,
            };
            positionList.push(position);
          }
        }

        poolStore.setPoolList(poolList);
        poolStore.setPositionList(positionList);
      }
    })();
  }, [height, client.client]);
  return (
    <div className="flex items-center">
      <div className={"mr-1 h-2 w-2 rounded-full bg-green-400"}></div>
      <div className="text-xs text-slate-600">{height ?? "-"}</div>
    </div>
  );
}
