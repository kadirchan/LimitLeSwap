"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWalletStore } from "@/lib/stores/wallet";
import { ArrowUpDown, Route } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Pool, usePoolStore } from "@/lib/stores/poolStore";
import useHasMounted from "@/lib/customHooks";
import { useClientStore } from "@/lib/stores/client";
import { Balance, TokenId } from "@proto-kit/library";
import { useToast } from "@/components/ui/use-toast";
import { Poseidon, PublicKey } from "o1js";

export default function Swap() {
  const walletStore = useWalletStore();
  const onConnectWallet = walletStore.connectWallet;
  const wallet = walletStore.wallet;
  const [state, setState] = useState({
    sellToken: "MINA",
    buyToken: "USDT",
    sellAmount: 0,
    buyAmount: 0,
    priceImpact: "0",
  });

  const [pool, setPool] = useState<Pool | null>(null);
  const poolStore = usePoolStore();
  const hasMounted = useHasMounted();
  const client = useClientStore();
  const { toast } = useToast();

  useEffect(() => {
    let sellToken = poolStore.tokenList.find(
      (token) => token.name === state.sellToken,
    );
    let buyToken = poolStore.tokenList.find(
      (token) => token.name === state.buyToken,
    );
    const pool = poolStore.poolList.find((pool) => {
      return (
        (pool.token0.name === sellToken?.name &&
          pool.token1.name === buyToken?.name) ||
        (pool.token0.name === buyToken?.name &&
          pool.token1.name === sellToken?.name)
      );
    });
    setPool(pool ?? null);
    // console.log(pool);
    if (pool) {
      const sellAmount = Number(state.sellAmount);
      const buyAmount = Number(state.buyAmount);

      const poolSellTokenReserve =
        pool.token0.name === sellToken?.name
          ? Number(pool.token0Amount)
          : Number(pool.token1Amount);

      const poolBuyTokenReserve =
        pool.token0.name === buyToken?.name
          ? Number(pool.token0Amount)
          : Number(pool.token1Amount);

      if (sellAmount >= poolSellTokenReserve) {
        setState({
          ...state,
          buyAmount: 0,
        });
        return;
      } else {
        const amountInWithFee = sellAmount * 997;

        const numerator = poolBuyTokenReserve * poolSellTokenReserve * 1000;
        const denominator = poolSellTokenReserve * 1000 + amountInWithFee;
        const amountOut = poolBuyTokenReserve - numerator / denominator;

        const priceImpact = (amountOut / poolBuyTokenReserve) * 100;
        setState({
          ...state,
          buyAmount: amountOut,
          priceImpact: priceImpact.toPrecision(2),
        });
      }
    }
  }, [
    state.sellToken,
    state.buyToken,
    hasMounted,
    state.sellAmount,
    poolStore.poolList,
  ]);

  const handleSubmit = async () => {
    console.log(state);

    let sellToken = poolStore.tokenList.find(
      (token) => token.name === state.sellToken,
    );
    let buyToken = poolStore.tokenList.find(
      (token) => token.name === state.buyToken,
    );

    if (sellToken?.name === buyToken?.name) {
      toast({
        title: "Invalid token selection",
        description: "Please select different tokens to swap",
      });
      return;
    }

    if (!pool || !sellToken || !buyToken || !wallet || !client.client) {
      return;
    }

    const tokenIn = TokenId.from(sellToken?.tokenId);
    const tokenOut = TokenId.from(buyToken?.tokenId);
    const amountIn = Balance.from(state.sellAmount);
    const amountOut = Balance.from(Math.floor(state.buyAmount));

    console.log(amountIn.toString(), amountOut.toString());
    console.log(Poseidon.hash([tokenIn, tokenOut]));

    const poolModule = client.client.runtime.resolve("PoolModule");

    const tx = await client.client.transaction(
      PublicKey.fromBase58(wallet),
      async () => {
        await poolModule.rawSwap(tokenIn, tokenOut, amountIn, amountOut);
      },
    );

    await tx.sign();
    await tx.send();

    //@ts-ignore
    walletStore.addPendingTransaction(tx.transaction);
  };
  return (
    <div className="mx-auto -mt-32 h-full pt-16">
      <div className="flex h-full w-full items-center justify-center pt-16">
        <div className="flex basis-4/12 flex-col items-center justify-center 2xl:basis-3/12">
          <Card className="w-full border-0 p-4 shadow-none">
            <div className="mb-2 flex flex-row items-center justify-center gap-2">
              <h2 className="text-2xl font-bold">Swap</h2>
              <Route className="h-6 w-6"></Route>
            </div>

            <div className="flex flex-row items-center rounded-2xl border p-4">
              <Label className="px-3 text-sm text-gray-600">
                Sell
                <CustomInput
                  value={state.sellAmount}
                  onChange={(e) => {
                    setState({ ...state, sellAmount: Number(e.target.value) });
                  }}
                  placeholder={"0"}
                  pattern="^[0-9]*[.,]?[0-9]*$"
                  minLength={1}
                  maxLength={40}
                  inputMode="decimal"
                />
              </Label>

              <Select
                value={state.sellToken}
                onValueChange={(value) => {
                  setState({ ...state, sellToken: value });
                }}
              >
                <SelectTrigger className=" w-60 rounded-2xl">
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
                className=" absolute bottom-0 left-0 right-0 top-0 mx-auto my-auto border-0  ring-1 ring-border ring-offset-4 hover:bg-card"
                size={"icon"}
                onClick={() => {
                  const sellToken = state.sellToken;
                  const buyToken = state.buyToken;

                  setState({
                    ...state,
                    sellToken: buyToken,
                    buyToken: sellToken,
                  });
                }}
              >
                <ArrowUpDown className="h-3 w-3 "></ArrowUpDown>
              </Button>
            </div>

            <div className="mt-4 flex flex-row items-center rounded-2xl border p-4">
              <Label className="px-3 text-sm text-gray-600">
                Buy
                <CustomInput
                  value={state.buyAmount}
                  readOnly
                  placeholder={"0"}
                  pattern="^[0-9]*[.,]?[0-9]*$"
                  minLength={1}
                  maxLength={40}
                  inputMode="decimal"
                  type="number"
                />
                <p>Price Impact: {state.priceImpact} %</p>
              </Label>

              <Select
                value={state.buyToken}
                onValueChange={(value) => {
                  setState({ ...state, buyToken: value });
                }}
              >
                <SelectTrigger className=" w-60 rounded-2xl">
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
              {wallet ? (pool ? "Swap" : "Pool Not Found") : "Connect wallet"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
