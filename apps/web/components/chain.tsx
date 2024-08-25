import { useClientStore } from "@/lib/stores/client";
import { Pool, Token, usePoolStore } from "@/lib/stores/poolStore";
import { tokens } from "@/lib/tokens";
import { Field } from "o1js";
import { useEffect } from "react";

export interface ChainProps {
  height?: string;
}

export function Chain({ height }: ChainProps) {
  const client = useClientStore();
  const poolStore = usePoolStore();

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

          if (token0Id < token1Id) {
            const pool: Pool = {
              poolId: poolId.toString(),
              token0: tokenList.find((token) => token.tokenId === token0Id)!,
              token1: tokenList.find((token) => token.tokenId === token1Id)!,
              token0Amount,
              token1Amount,
            };

            // console.log(pool);
            poolList.push(pool);
          } else {
            const pool: Pool = {
              poolId: poolId.toString(),
              token0: tokenList.find((token) => token.tokenId === token1Id)!,
              token1: tokenList.find((token) => token.tokenId === token0Id)!,
              token1Amount,
              token0Amount,
            };

            // console.log(pool);
            poolList.push(pool);
          }
        }

        poolStore.setPoolList(poolList);
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
