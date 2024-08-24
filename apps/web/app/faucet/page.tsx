"use client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/lib/stores/wallet";
import { useBalancesStore, useFaucet } from "@/lib/stores/balances";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { usePoolStore } from "@/lib/stores/poolStore";

export default function Faucet() {
  const walletStore = useWalletStore();
  const wallet = walletStore.wallet;
  const onConnectWallet = walletStore.connectWallet;
  const drip = useFaucet();
  const [token, setToken] = useState("MINA");
  const poolStore = usePoolStore();
  const balances = useBalancesStore();
  return (
    <div className="mx-auto -mt-32 h-full pt-16">
      <div className="flex h-full w-full items-center justify-center pt-16">
        <div className="flex basis-4/12 flex-col items-center justify-center 2xl:basis-3/12">
          <Card className="w-full p-4">
            <div className="mb-2">
              <h2 className="text-xl font-bold">Faucet</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Get testing (L2) MINA tokens for your wallet
              </p>
            </div>

            <div className="pt-3">
              <Label>
                To <span className="text-sm text-zinc-500">(your wallet)</span>
              </Label>

              <Input
                disabled
                placeholder={wallet ?? "Please connect a wallet first"}
              />
            </div>

            <div className="mt-6 flex flex-row items-center justify-center gap-4">
              <Select
                value={token}
                onValueChange={(value) => {
                  const tokenId = poolStore.tokenList.find(
                    (token) => token.name === value,
                  )?.tokenId;
                  console.log(tokenId);
                  balances.setFaucetTokenId(tokenId ?? "0");
                  setToken(value);
                }}
              >
                <SelectTrigger className=" w-60 rounded-2xl">
                  <SelectValue placeholder="Select a token to drip" />
                </SelectTrigger>

                <SelectContent className=" items-center  rounded-2xl text-center">
                  <SelectItem value="MINA">MINA</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size={"lg"}
                type="submit"
                className=" w-full rounded-2xl"
                onClick={() => {
                  wallet ?? onConnectWallet();
                  wallet && drip();
                }}
              >
                {wallet ? "Drip 💦" : "Connect wallet"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
