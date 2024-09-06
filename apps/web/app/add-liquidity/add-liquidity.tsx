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
import { DECIMALS } from "@/lib/constants";
import useHasMounted from "@/lib/customHooks";
import { useClientStore } from "@/lib/stores/client";
import { Pool, Position, usePoolStore } from "@/lib/stores/poolStore";
import { useWalletStore } from "@/lib/stores/wallet";
import { Balance, TokenId } from "@proto-kit/library";
import { ArrowDown, Droplets, Plus } from "lucide-react";
import { PublicKey } from "o1js";
import React, { useEffect, useState } from "react";

export default function AddLiq() {
  const walletStore = useWalletStore();
  const wallet = walletStore.wallet;
  const onConnectWallet = walletStore.connectWallet;
  const poolStore = usePoolStore();
  const hasMounted = useHasMounted();
  const client = useClientStore();
  const { toast } = useToast();
  const calculateQuote = (
    tokenAReserve: number,
    tokenBReserve: number,
    tokenAAmount: number,
  ) => {
    return (tokenBReserve * tokenAAmount) / tokenAReserve;
  };

  const [pool, setPool] = useState<Pool | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [state, setState] = useState({
    tokenAmountA: 0,
    tokenAmountB: 0,
    tokenA: "MINA",
    tokenB: "USDT",
    lpRequested: 0,
    emptyPool: false,
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

      console.log(pool, pos);
      setPosition(pos ?? null);
    }
  }, [state.tokenA, state.tokenB, hasMounted, poolStore.poolList]);
  const handleSubmit = async () => {
    let tokenAid = poolStore.tokenList.find(
      (token) => token.name === state.tokenA,
    );
    let tokenBid = poolStore.tokenList.find(
      (token) => token.name === state.tokenB,
    );
    if (
      client.client &&
      wallet &&
      pool &&
      state.lpRequested > 0 &&
      tokenAid &&
      tokenBid
    ) {
      const poolModule = client.client.runtime.resolve("PoolModule");

      const tokenA = TokenId.from(tokenAid?.tokenId);
      const tokenB = TokenId.from(tokenBid?.tokenId);
      const tokenAmountA = Balance.from(
        BigInt(state.tokenAmountA * Number(DECIMALS)),
      );
      const tokenAmountB = Balance.from(
        BigInt(state.tokenAmountB * Number(DECIMALS)),
      );
      const lpAmount = Balance.from(
        BigInt(Math.floor(state.lpRequested * Number(DECIMALS))),
      );

      console.log("Adding liquidity");

      console.log(state.tokenA, tokenAmountA.toString());
      console.log(state.tokenB, tokenAmountB.toString());
      console.log(
        tokenAmountA.mul(Balance.from(pool.token0Amount)).toString(),
        pool.token0.name,
      );
      console.log(
        tokenAmountB.mul(Balance.from(pool.token1Amount)).toString(),
        pool.token1.name,
      );
      console.log(lpAmount.toString());

      const tx = await client.client.transaction(
        PublicKey.fromBase58(wallet),
        async () => {
          await poolModule.addLiquidity(
            tokenA,
            tokenB,
            tokenAmountA,
            tokenAmountB,
            lpAmount,
          );
        },
      );
      await tx.sign();
      await tx.send();

      //@ts-ignore
      walletStore.addPendingTransaction(tx.transaction);
    }
  };

  const handleEmptyPool = async () => {
    let tokenA = poolStore.tokenList.find(
      (token) => token.name === state.tokenA,
    );
    let tokenB = poolStore.tokenList.find(
      (token) => token.name === state.tokenB,
    );
    if (state.tokenAmountA <= 0 || state.tokenAmountB <= 0) {
      toast({
        title: "Invalid token amount",
        description: "Please enter a valid token amount",
      });
      return;
    }
    if (client.client && wallet && tokenA && tokenB) {
      const TokenIdA = TokenId.from(tokenA.tokenId);
      const TokenIdB = TokenId.from(tokenB.tokenId);
      const TokenAmountA = Balance.from(
        BigInt(state.tokenAmountA * Number(DECIMALS)),
      );
      const TokenAmountB = Balance.from(
        BigInt(state.tokenAmountB * Number(DECIMALS)),
      );
      const lpRequested = Balance.from(
        BigInt(
          Math.floor(
            Math.sqrt(state.tokenAmountA * state.tokenAmountB) *
              Number(DECIMALS),
          ),
        ),
      );

      console.log(lpRequested.mul(lpRequested).toString());
      console.log(TokenAmountA.mul(TokenAmountB).toString());

      const poolModule = client.client.runtime.resolve("PoolModule");

      const tx = await client.client.transaction(
        PublicKey.fromBase58(wallet),
        async () => {
          await poolModule.addLiquidityToEmpty(
            TokenIdA,
            TokenIdB,
            TokenAmountA,
            TokenAmountB,
            PublicKey.fromBase58(wallet),
            lpRequested,
          );
        },
      );

      await tx.sign();
      await tx.send();
      //@ts-ignore
      walletStore.addPendingTransaction(tx.transaction);
    }
  };
  return (
    <div className="mx-auto -mt-32 h-full pt-16">
      <div className="flex h-full w-full items-center justify-center pt-16">
        <div className="flex basis-5/12 flex-col items-center justify-center 2xl:basis-3/12">
          <Card className="flex w-full flex-col items-center border-0 p-4 shadow-none">
            <div className="mb-2 flex flex-row items-center justify-center gap-2">
              <h2 className="text-2xl font-bold">Add Liquidity</h2>
              <Droplets className="h-6 w-6" />
            </div>

            <div className="flex flex-row items-center rounded-2xl border p-4">
              <CustomInput
                value={state.tokenAmountA}
                onChange={(e) => {
                  const tokenAmountA = Number(e.target.value);
                  const tokenAReserve =
                    pool?.token0.name === state.tokenA
                      ? Number(pool?.token0Amount)
                      : Number(pool?.token1Amount);
                  const tokenBReserve =
                    pool?.token0.name === state.tokenA
                      ? Number(pool?.token1Amount)
                      : Number(pool?.token0Amount);
                  if (
                    tokenAReserve &&
                    tokenBReserve &&
                    tokenAReserve > 0 &&
                    tokenBReserve > 0
                  ) {
                    const tokenAmountB = calculateQuote(
                      tokenAReserve,
                      tokenBReserve,
                      tokenAmountA,
                    );

                    const lpRequested = Math.sqrt(tokenAmountA * tokenAmountB);

                    setState({
                      ...state,
                      tokenAmountA: tokenAmountA,
                      tokenAmountB: tokenAmountB,
                      lpRequested: lpRequested,
                    });
                  } else {
                    setState({
                      ...state,
                      tokenAmountA: tokenAmountA,
                      emptyPool: true,
                    });
                  }
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
                  {/* <img src={`/${state.tokenA}.png`} className=" h-4 w-4" /> */}
                  <SelectValue placeholder="Select a token to swap" />
                </SelectTrigger>

                <SelectContent className=" items-center  rounded-2xl text-center">
                  <SelectItem value="MINA">
                    <div className=" flex w-full flex-row gap-4">
                      <img src={`/MINA.png`} className=" h-4 w-4" />
                      MINA
                    </div>
                  </SelectItem>
                  <SelectItem value="USDT">
                    <div className=" flex w-full flex-row gap-4">
                      <img src={`/USDT.png`} className=" h-4 w-4" />
                      USDT
                    </div>
                  </SelectItem>
                  <SelectItem value="ETH">
                    <div className=" flex w-full flex-row gap-4">
                      <img src={`/ETH.png`} className=" h-4 w-4" />
                      ETH
                    </div>
                  </SelectItem>
                  <SelectItem value="BTC">
                    <div className=" flex w-full flex-row gap-4">
                      <img src={`/BTC.png`} className=" h-4 w-4" />
                      BTC
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative my-2 w-10">
              <Button
                variant={"outline"}
                className=" absolute bottom-0 left-0 right-0 top-0 mx-auto my-auto cursor-default  border-0 ring-1 ring-border ring-offset-4 hover:bg-card"
                size={"icon"}
              >
                <Plus className="h-3 w-3 "></Plus>
              </Button>
            </div>

            <div className=" flex flex-row items-center rounded-2xl border p-4">
              <CustomInput
                value={state.tokenAmountB}
                onChange={(e) => {
                  const tokenAmountB = Number(e.target.value);
                  const tokenAReserve =
                    pool?.token0.name === state.tokenB
                      ? Number(pool?.token0Amount)
                      : Number(pool?.token1Amount);
                  const tokenBReserve =
                    pool?.token0.name === state.tokenB
                      ? Number(pool?.token1Amount)
                      : Number(pool?.token0Amount);
                  if (
                    tokenAReserve &&
                    tokenBReserve &&
                    tokenAReserve > 0 &&
                    tokenBReserve > 0
                  ) {
                    const tokenAmountA = calculateQuote(
                      tokenAReserve,
                      tokenBReserve,
                      tokenAmountB,
                    );
                    const lpRequested = Math.sqrt(tokenAmountA * tokenAmountB);

                    setState({
                      ...state,
                      tokenAmountA: tokenAmountA,
                      tokenAmountB: tokenAmountB,
                      lpRequested: lpRequested,
                    });
                  } else {
                    setState({
                      ...state,
                      tokenAmountB: tokenAmountB,
                      emptyPool: true,
                    });
                  }
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
                  {/* <img src={`/${state.tokenB}.png`} className=" h-4 w-4" /> */}
                  <SelectValue placeholder="Select a token to swap" />
                </SelectTrigger>

                <SelectContent className=" items-center  rounded-2xl text-center">
                  <SelectItem value="MINA">
                    <div className=" flex w-full flex-row gap-4">
                      <img src={`/MINA.png`} className=" h-4 w-4" />
                      MINA
                    </div>
                  </SelectItem>
                  <SelectItem value="USDT">
                    <div className=" flex w-full flex-row gap-4">
                      <img src={`/USDT.png`} className=" h-4 w-4" />
                      USDT
                    </div>
                  </SelectItem>
                  <SelectItem value="ETH">
                    <div className=" flex w-full flex-row gap-4">
                      <img src={`/ETH.png`} className=" h-4 w-4" />
                      ETH
                    </div>
                  </SelectItem>
                  <SelectItem value="BTC">
                    <div className=" flex w-full flex-row gap-4">
                      <img src={`/BTC.png`} className=" h-4 w-4" />
                      BTC
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="my-2 flex w-10 items-center justify-center">
              <ArrowDown className="h-6 w-6" />
            </div>

            <div className="mt-2 flex w-full flex-col items-center gap-4 rounded-2xl border p-4">
              <h3 className=" py-2 text-sm">
                Current Prices and Your Pool Share
              </h3>
              <div className="grid w-full grid-cols-3">
                <div className="col-span-1 flex flex-col items-center">
                  <p>
                    {pool && Number(pool?.lpTokenSupply) > 0
                      ? (
                          Number(pool?.token0Amount) /
                          Number(pool?.token1Amount)
                        ).toFixed(2)
                      : 0}
                  </p>
                  <p className=" text-custom-input text-sm">{`${state.tokenA} / ${state.tokenB}`}</p>
                </div>
                <div className="col-span-1 flex flex-col items-center">
                  <p>
                    {pool && Number(pool?.lpTokenSupply) > 0
                      ? (
                          Number(pool?.token1Amount) /
                          Number(pool?.token0Amount)
                        ).toFixed(2)
                      : 0}
                  </p>
                  <p className=" text-custom-input text-sm">{`${state.tokenB} / ${state.tokenA}`}</p>
                </div>
                <div className="col-span-1 flex flex-col items-center">
                  {state.lpRequested > 0 && pool ? (
                    <p className=" text-green-600">
                      {`${(
                        (((position ? Number(position.lpTokenAmount) : 0) +
                          state.lpRequested) /
                          (Number(pool.lpTokenSupply) + state.lpRequested)) *
                        100
                      ).toFixed(1)} %`}
                    </p>
                  ) : (
                    <p>{`${
                      pool && position
                        ? (
                            (Number(position.lpTokenAmount) /
                              Number(pool.lpTokenSupply)) *
                            100
                          ).toFixed(1)
                        : 0
                    } %`}</p>
                  )}
                  <p className=" text-custom-input text-sm">Share of pool</p>
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
                wallet && !state.emptyPool && handleSubmit();
                wallet && state.emptyPool && handleEmptyPool();
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
