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
import { useEffect, useState } from "react";
import { usePoolStore } from "@/lib/stores/poolStore";

export default function Faucet() {
  const walletStore = useWalletStore();
  const wallet = walletStore.wallet;
  const onConnectWallet = walletStore.connectWallet;
  const drip = useFaucet();
  const [token, setToken] = useState("MINA");
  const [loading, setLoading] = useState(true);
  const poolStore = usePoolStore();
  const balances = useBalancesStore();

  useEffect(() => {
    if (poolStore.tokenList.length > 0) {
      const tokenId = poolStore.tokenList.find(
        (_token) => _token.name === token,
      )?.tokenId;
      console.log(tokenId);
      balances.setFaucetTokenId(tokenId ?? "0");
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [token, poolStore.tokenList]);

  return (
    <div className="mx-auto -mt-32 h-full pt-16">
      <div className="flex h-full w-full items-center justify-center pt-16">
        <div className="flex basis-4/12 flex-col items-center justify-center 2xl:basis-3/12">
          <Card className="w-full rounded-2xl p-4">
            <div className="mb-2">
              <h2 className="text-xl font-bold">Token Faucet</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Get testing (L2) tokens for your wallet
              </p>
            </div>

            <div className="pt-3">
              <Label>
                To <span className="text-sm text-zinc-500">(your wallet)</span>
              </Label>

              <Input
                className="w-full rounded-2xl"
                disabled
                placeholder={wallet ?? "Please connect a wallet first"}
              />
            </div>

            <div className="mt-6 flex flex-row items-center justify-center gap-4">
              <Select
                value={token}
                onValueChange={(value) => {
                  setToken(value);
                }}
              >
                <SelectTrigger className=" w-60 rounded-2xl">
                  {/* <img src={`/${token}.png`} className=" h-4 w-4" /> */}
                  <SelectValue placeholder="Select a token to drip" />
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

              <Button
                size={"lg"}
                type="submit"
                className=" w-full rounded-2xl"
                disabled={loading}
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
