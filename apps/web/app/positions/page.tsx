"use client";
import React, { useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Position, usePoolStore } from "@/lib/stores/poolStore";
import { useWalletStore } from "@/lib/stores/wallet";
import { useClientStore } from "@/lib/stores/client";
import { BalancesKey, TokenId } from "@proto-kit/library";
import { PublicKey } from "o1js";
import { useChainStore } from "@/lib/stores/chain";

export default function Positions() {
  const client = useClientStore();
  const chainStore = useChainStore();
  const poolStore = usePoolStore();
  const walletStore = useWalletStore();
  const { wallet } = walletStore;

  useEffect(() => {
    if (!client.client || !wallet) return;
    (async () => {
      const positionList: Position[] = [];

      for (let pool of poolStore.poolList) {
        const poolId = pool.poolId;
        const userKey = BalancesKey.from(
          TokenId.from(poolId),
          PublicKey.fromBase58(wallet),
        );
        const userLpBalance =
          await client.client!.query.runtime.Balances.balances.get(userKey);

        if (!userLpBalance) {
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
      console.log(positionList);
      poolStore.setPositionList(positionList);
    })();
  }, [client.client, wallet, chainStore.block?.height]);
  return (
    <div className="mx-auto -mt-32 h-full pt-16">
      <div className="flex h-full w-full items-center justify-center pt-16">
        <div className="flex basis-2/5 flex-col items-center justify-center">
          <h2 className=" p-4 text-lg font-bold">My Positions</h2>
          <div className="rounded-2xl border">
            <Table>
              {/* <TableCaption>A list of your recent positions.</TableCaption> */}
              <TableHeader>
                <TableRow>
                  <TableHead>Pair</TableHead>
                  <TableHead>Pool Tokens</TableHead>
                  <TableHead>Reserved Tokens</TableHead>
                  <TableHead>Pool Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poolStore.positionList.length > 0 ? (
                  poolStore.positionList.map((position, i) => (
                    <TableRow key={i} className=" cursor-pointer">
                      <TableCell className=" text-center">
                        {position.token0.name} / {position.token1.name}
                      </TableCell>
                      <TableCell className=" text-center">
                        {position.lpTokenAmount}
                      </TableCell>
                      <TableCell className=" flex flex-col gap-2">
                        <div>
                          {position.token0Amount} {position.token0.name}
                        </div>
                        <div>
                          {position.token1Amount} {position.token1.name}
                        </div>
                      </TableCell>
                      <TableCell className=" text-center">
                        {(Number(position.lpTokenAmount) /
                          Number(position.lpTokenTotalSupply)) *
                          100}{" "}
                        %
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className=" text-center">
                      No positions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
