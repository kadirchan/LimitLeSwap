"use client";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useClientStore } from "@/lib/stores/client";
import { usePoolStore } from "@/lib/stores/poolStore";
import { useWalletStore } from "@/lib/stores/wallet";
import { ArrowUpDown } from "lucide-react";
import { Field, PublicKey, UInt64 } from "o1js";
import { TokenId } from "@proto-kit/library";
import React, { useEffect, useState } from "react";
import OrderBook from "@/components/orderBook";
import MyOrders from "@/components/myOrders";
import { DECIMALS } from "@/lib/constants";

export default function LimitOrder() {
  const walletStore = useWalletStore();
  const wallet = walletStore.wallet;
  const onConnectWallet = walletStore.connectWallet;
  const client = useClientStore();
  const { toast } = useToast();
  const poolStore = usePoolStore();

  const [state, setState] = useState({
    sellToken: "MINA",
    buyToken: "USDT",
    sellAmount: 0,
    buyAmount: 0,
    rate: "0",
    validForDays: 1,
  });

  useEffect(() => {
    if (state.sellAmount > 0 && state.buyAmount > 0) {
      const rate = (state.buyAmount / state.sellAmount).toFixed(2);
      setState({
        ...state,
        rate,
      });
    } else {
      setState({
        ...state,
        rate: "0",
      });
    }
  }, [state.buyAmount, state.sellAmount]);

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

    const sellAmount = state.sellAmount;
    const buyAmount = state.buyAmount;
    const validForDays = state.validForDays;

    console.log({
      sellToken,
      buyToken,
      sellAmount,
      buyAmount,
      validForDays,
    });

    if (client.client && wallet && sellToken && buyToken) {
      const limitOrders = client.client.runtime.resolve("LimitOrders");
      const tokenIn = TokenId.from(sellToken.tokenId);
      const tokenOut = TokenId.from(buyToken.tokenId);
      const amountIn = Field.from(BigInt(sellAmount * Number(DECIMALS)));
      const amountOut = Field.from(BigInt(buyAmount * Number(DECIMALS)));
      const expiration = UInt64.from(validForDays * 17280);
      const tx = await client.client.transaction(
        PublicKey.fromBase58(wallet),
        async () => {
          await limitOrders.createLimitOrder(
            tokenIn,
            tokenOut,
            amountIn,
            amountOut,
            expiration,
          );
        },
      );
      console.log("Creating limit order");
      await tx.sign();
      await tx.send();

      //@ts-ignore
      walletStore.addPendingTransaction(tx.transaction);
    }
  };

  return (
    <div className="mx-auto -mt-32 h-full pt-16">
      <div className="flex h-full w-full flex-row items-center justify-center pt-16">
        <div className="flex basis-1/2 flex-col items-center justify-center ">
          <div className="flex basis-4/5 flex-col gap-4">
            <div className=" flex basis-1/2 flex-row gap-4">
              <div className=" flex basis-3/5 flex-col  items-center">
                <div className="mb-2 flex flex-row items-center justify-center gap-2">
                  <h2 className="text-2xl font-bold">Set Limit Order</h2>
                </div>

                <div className="flex flex-row items-center rounded-2xl border p-4">
                  <Label className="px-3 text-sm text-gray-600">
                    Sell
                    <CustomInput
                      value={state.sellAmount}
                      onChange={(e) => {
                        setState({
                          ...state,
                          sellAmount: Number(e.target.value),
                        });
                      }}
                      placeholder={"0"}
                      pattern="^[0-9]*[.,]?[0-9]*$"
                      minLength={1}
                      maxLength={40}
                      inputMode="decimal"
                      type="number"
                    />
                  </Label>

                  <Select
                    value={state.sellToken}
                    onValueChange={(value) => {
                      setState({ ...state, sellToken: value });
                    }}
                  >
                    <SelectTrigger className=" w-60 rounded-2xl">
                      <img
                        src={`/${state.sellToken}.png`}
                        className=" h-4 w-4"
                      />
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

                <div className="relative my-2 w-10">
                  <Button
                    variant={"outline"}
                    className=" absolute bottom-0 left-0 right-0 top-0 mx-auto my-auto border-0  ring-1 ring-border ring-offset-4 hover:bg-card"
                    size={"icon"}
                    onClick={() => {
                      const sell = state.sellToken;
                      const buy = state.buyToken;

                      setState({
                        ...state,
                        sellToken: buy,
                        buyToken: sell,
                      });
                    }}
                  >
                    <ArrowUpDown className="h-3 w-3 "></ArrowUpDown>
                  </Button>
                </div>

                <div className="flex flex-row items-center rounded-2xl border p-4">
                  <Label className="px-3 text-sm text-gray-600">
                    For
                    <CustomInput
                      value={state.buyAmount}
                      onChange={(e) => {
                        setState({
                          ...state,
                          buyAmount: Number(e.target.value),
                        });
                      }}
                      placeholder={"0"}
                      pattern="^[0-9]*[.,]?[0-9]*$"
                      minLength={1}
                      maxLength={40}
                      inputMode="decimal"
                      type="number"
                    />
                  </Label>

                  <Select
                    value={state.buyToken}
                    onValueChange={(value) => {
                      setState({ ...state, buyToken: value });
                    }}
                  >
                    <SelectTrigger className=" w-60 rounded-2xl">
                      <img
                        src={`/${state.buyToken}.png`}
                        className=" h-4 w-4"
                      />
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
              </div>
              <div className=" flex basis-2/5">
                <OrderBook
                  tokenIn={state.sellToken}
                  tokenOut={state.buyToken}
                />
              </div>
            </div>
            <div className=" flex basis-1/2 flex-row gap-4">
              <div className=" flex basis-3/5 flex-col">
                <div className="grid grid-cols-5 rounded-2xl border p-4">
                  <div className=" col-span-3">
                    <Label className="px-3 text-sm text-gray-600">
                      {state.sellToken} / {state.buyToken} Rate
                      <CustomInput
                        className=" text-xl"
                        value={state.rate}
                        placeholder="0"
                        readOnly
                        type="text"
                      />
                    </Label>
                  </div>

                  <div className=" col-span-2">
                    <Label className="px-3 text-sm text-gray-600">
                      Valid For Days
                      <CustomInput
                        value={state.validForDays}
                        onChange={(e) => {
                          setState({
                            ...state,
                            validForDays: Number(e.target.value),
                          });
                        }}
                        placeholder={"0"}
                        pattern="^[0-9]*[.,]?[0-9]*$"
                        minLength={1}
                        maxLength={40}
                        inputMode="decimal"
                        type="number"
                      />
                    </Label>
                  </div>
                </div>

                <Button
                  size={"lg"}
                  type="submit"
                  className="mt-6 w-full rounded-2xl"
                  onClick={() => {
                    wallet ?? onConnectWallet();
                    wallet && handleSubmit();
                  }}
                >
                  {wallet ? "Place Order" : "Connect wallet"}
                </Button>
              </div>
              <div className="flex basis-2/5">
                <MyOrders />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
