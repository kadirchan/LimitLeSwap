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
import React, { useState } from "react";

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

  const handleSubmit = () => {
    console.log("submit");
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
              onClick={() => {
                wallet ?? onConnectWallet();
                wallet && handleSubmit();
              }}
            >
              {wallet ? "Swap" : "Connect wallet"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
