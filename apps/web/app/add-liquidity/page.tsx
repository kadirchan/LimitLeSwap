"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomInput } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import useHasMounted from "@/lib/customHooks";
import { useClientStore } from "@/lib/stores/client";
import { Pool, Position, usePoolStore } from "@/lib/stores/poolStore";
import { useWalletStore } from "@/lib/stores/wallet";
import { ArrowDown, Droplets, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";

export default function AddLiq() {
  const walletStore = useWalletStore();
  const wallet = walletStore.wallet;
  const onConnectWallet = walletStore.connectWallet;
  const poolStore = usePoolStore();
  const hasMounted = useHasMounted();
  const client = useClientStore();
  const { toast } = useToast();

  const handleSubmit = () => {
    console.log("submit");
  };

  const [pool, setPool] = useState<Pool | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [state, setState] = useState({
    tokenAmountA: 0,
    tokenAmountB: 0,
    tokenA: "MINA",
    tokenB: "USDT",
  });
  useEffect(() => {
    let tokenA = poolStore.tokenList.find(
      (token) => token.name === state.tokenA,
    );
    let tokenB = poolStore.tokenList.find(
      (token) => token.name === state.tokenB,
    );
    const pool = poolStore.poolList.find((pool) => {
      return (
        (pool.token0.name === tokenA?.name &&
          pool.token1.name === tokenB?.name) ||
        (pool.token0.name === tokenB?.name && pool.token1.name === tokenA?.name)
      );
    });
    setPool(pool ?? null);
    if (pool) {
      const pos = poolStore.positionList.find((pos) => {
        return pos.poolId.toString() === pool.poolId.toString();
      });

      setPosition(pos ?? null);
    }
  }, [state.tokenA, state.tokenB, hasMounted, poolStore.poolList]);
  return (
    <div className="mx-auto -mt-32 h-full pt-16">
      <div className="flex h-full w-full items-center justify-center pt-16">
        <div className="flex basis-4/12 flex-col items-center justify-center 2xl:basis-3/12">
          <Card className="w-full border-0 p-4 shadow-none">
            <div className="mb-2 flex flex-row items-center justify-center gap-2">
              <h2 className="text-2xl font-bold">Add Liquidity</h2>
              <Droplets className="h-6 w-6" />
            </div>

            <div className="flex flex-row items-center rounded-2xl border p-4">
              <CustomInput
                value={state.tokenAmountA}
                onChange={(e) => {
                  setState({ ...state, tokenAmountA: Number(e.target.value) });
                }}
                placeholder={"0"}
                pattern="^[0-9]*[.,]?[0-9]*$"
                minLength={1}
                maxLength={40}
                inputMode="decimal"
              />

              <Select
                value={state.tokenA}
                onValueChange={(value) => {
                  setState({ ...state, tokenA: value });
                }}
              >
                <SelectTrigger className=" w-60 rounded-2xl">
                  <img src={`/${state.tokenA}.png`} className=" h-4 w-4" />
                  <SelectValue placeholder="Select a token to swap" />
                </SelectTrigger>

                <SelectContent className=" items-center  rounded-2xl text-center">
                  <SelectItem value="MINA">MINA</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative my-2 w-96">
              <Button
                variant={"outline"}
                className=" absolute bottom-0 left-0 right-0 top-0 mx-auto my-auto cursor-default  border-0 ring-1 ring-border ring-offset-4 hover:bg-card"
                size={"icon"}
              >
                <Plus className="h-3 w-3 "></Plus>
              </Button>
            </div>

            <div className="mt-4 flex flex-row items-center rounded-2xl border p-4">
              <CustomInput
                value={state.tokenAmountB}
                onChange={(e) => {
                  setState({ ...state, tokenAmountB: Number(e.target.value) });
                }}
                placeholder={"0"}
                pattern="^[0-9]*[.,]?[0-9]*$"
                minLength={1}
                maxLength={40}
                inputMode="decimal"
              />

              <Select
                value={state.tokenB}
                onValueChange={(value) => {
                  setState({ ...state, tokenB: value });
                }}
              >
                <SelectTrigger className=" w-60 rounded-2xl">
                  <img src={`/${state.tokenB}.png`} className=" h-4 w-4" />
                  <SelectValue placeholder="Select a token to swap" />
                </SelectTrigger>

                <SelectContent className=" items-center  rounded-2xl text-center">
                  <SelectItem value="MINA">MINA</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="my-2 flex w-96 items-center justify-center">
              <ArrowDown className="h-6 w-6" />
            </div>

            <div className="mt-2 flex flex-col gap-4 rounded-2xl border p-4">
              <h3 className=" py-2 text-sm">
                Current Prices and Your Pool Share
              </h3>
              <div className="grid grid-cols-3">
                <div className="col-span-1 flex flex-col items-center">
                  <p>
                    {pool && Number(pool?.lpTokenSupply) > 0
                      ? (
                          Number(pool?.token0Amount) /
                          Number(pool?.token1Amount)
                        ).toPrecision(2)
                      : 0}
                  </p>
                  <p className=" text-sm text-gray-600">{`${state.tokenA} / ${state.tokenB}`}</p>
                </div>
                <div className="col-span-1 flex flex-col items-center">
                  <p>
                    {pool && Number(pool?.lpTokenSupply) > 0
                      ? (
                          Number(pool?.token1Amount) /
                          Number(pool?.token0Amount)
                        ).toPrecision(2)
                      : 0}
                  </p>
                  <p className=" text-sm text-gray-600">{`${state.tokenB} / ${state.tokenA}`}</p>
                </div>
                <div className="col-span-1 flex flex-col items-center">
                  <p>{`${
                    pool && position
                      ? (
                          (Number(position.lpTokenAmount) /
                            Number(pool.lpTokenSupply)) *
                          100
                        ).toPrecision(3)
                      : 0
                  } %`}</p>
                  <p className=" text-sm text-gray-600">Share of pool</p>
                </div>
              </div>
            </div>

            <Button
              size={"lg"}
              type="submit"
              className="mt-6 w-full rounded-2xl"
              disabled={!wallet || !pool}
              onClick={() => {
                wallet ?? onConnectWallet();
                wallet && handleSubmit();
              }}
            >
              {wallet
                ? pool
                  ? "Add Liquidity"
                  : "Pool Not Found"
                : "Connect wallet"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
