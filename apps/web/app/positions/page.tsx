"use client";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePoolStore } from "@/lib/stores/poolStore";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Positions() {
  const poolStore = usePoolStore();
  const router = useRouter();

  return (
    <div className="mx-auto -mt-32 h-full pt-16">
      <div className="flex h-full w-full items-center justify-center pt-16">
        <div className="flex basis-2/5 flex-col items-center justify-center">
          <h2 className=" p-4 text-lg font-bold">My Positions</h2>
          <div className="rounded-2xl border">
            <Table>
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <TableRow key={i} className=" cursor-pointer">
                          <TableCell className="flex flex-row items-center justify-around text-center">
                            <div className="relative flex h-4 w-8">
                              <div className=" absolute top-0">
                                <img
                                  src={`/${position.token0.name}.png`}
                                  className="h-4 w-4"
                                />
                              </div>
                              <div className=" absolute left-2">
                                <img
                                  src={`/${position.token1.name}.png`}
                                  className="h-4 w-4"
                                />
                              </div>
                            </div>
                            <span className="flex">
                              {position.token0.name} / {position.token1.name}
                            </span>
                          </TableCell>
                          <TableCell className=" text-center">
                            {position.lpTokenAmount}
                          </TableCell>
                          <TableCell className=" flex flex-col items-center justify-center gap-2">
                            <div>
                              {Math.floor(Number(position.token0Amount))}{" "}
                              {position.token0.name}
                            </div>
                            <div>
                              {Math.floor(Number(position.token1Amount))}{" "}
                              {position.token1.name}
                            </div>
                          </TableCell>
                          <TableCell className=" text-center">
                            {(
                              (Number(position.lpTokenAmount) /
                                Number(position.lpTokenTotalSupply)) *
                              100
                            ).toFixed(1)}{" "}
                            %
                          </TableCell>
                        </TableRow>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>
                            Manage {position.token0.name} /{" "}
                            {position.token1.name} Position
                          </DialogTitle>
                          <DialogDescription>
                            As you provide liquidity, you receive a share of the
                            0.3% fee cut from all transactions made on the pool
                            according to your pool share.
                          </DialogDescription>
                        </DialogHeader>

                        <div className=" flex flex-col gap-2 p-2">
                          <div className=" flex w-full flex-row justify-between">
                            <div className="flex text-base">
                              Your Pool Token Amount:
                            </div>
                            <div className="flex">{position.lpTokenAmount}</div>
                          </div>

                          <div className=" flex w-full flex-row justify-between">
                            <div className="flex text-base">
                              Your Pooled {position.token0.name} Amount:
                            </div>
                            <div className="flex">{position.token0Amount}</div>
                          </div>

                          <div className=" flex w-full flex-row justify-between">
                            <div className="flex text-base">
                              Your Pooled {position.token1.name} Amount:
                            </div>
                            <div className="flex">{position.token1Amount}</div>
                          </div>

                          <div className=" flex w-full flex-row justify-between">
                            <div className="flex text-base">
                              Your Pool Share:
                            </div>
                            <div className="flex">
                              {(Number(position.lpTokenAmount) /
                                Number(position.lpTokenTotalSupply)) *
                                100}{" "}
                              %
                            </div>
                          </div>
                        </div>

                        <DialogFooter className=" gap-4">
                          <Button
                            className=" w-24 rounded-2xl"
                            onClick={() => router.push("/add-liquidity")}
                          >
                            Add
                          </Button>
                          <Button
                            className=" w-24 rounded-2xl"
                            onClick={() => router.push("/remove-liquidity")}
                          >
                            Remove
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
