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
import { OrderBundle, Pool, Token, usePoolStore } from "@/lib/stores/poolStore";
import useHasMounted from "@/lib/customHooks";
import { useClientStore } from "@/lib/stores/client";
import { Balance, TokenId } from "@proto-kit/library";
import { useToast } from "@/components/ui/use-toast";
import { Field, Poseidon, PublicKey } from "o1js";
import { useLimitStore } from "@/lib/stores/limitStore";
import { useChainStore } from "@/lib/stores/chain";
import { DECIMALS } from "@/lib/constants";
import PoolRatio from "./poolRatio";

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
  const [seePoolDetails, setSeePoolDetails] = useState(false);
  const [newPool, setNewPool] = useState<Pool | null>(null);
  const [limitState, setlimitState] = useState<{
    execute: boolean;
    ordersToFill: null | any[];
    bestAmountOut: number;
    newPriceImpact: number;
  }>({
    execute: false,
    ordersToFill: [],
    bestAmountOut: 0,
    newPriceImpact: 0,
  });
  const poolStore = usePoolStore();
  const hasMounted = useHasMounted();
  const client = useClientStore();
  const { toast } = useToast();
  const limitStore = useLimitStore();
  const chainStore = useChainStore();

  const calculateSwap = (
    poolBuyTokenReserve: number,
    poolSellTokenReserve: number,
    sellAmount: number,
  ) => {
    const amountInWithFee = sellAmount * 997;

    const numerator = poolBuyTokenReserve * poolSellTokenReserve * 1000;
    const denominator = poolSellTokenReserve * 1000 + amountInWithFee;
    const amountOut = poolBuyTokenReserve - numerator / denominator;

    const price = (amountOut / sellAmount).toFixed(2);
    const priceImpact = (amountOut / poolBuyTokenReserve) * 100;

    return {
      amountOut,
      price,
      priceImpact,
    };
  };

  const calculateWithLimitOrders = (
    buyToken: Token,
    sellToken: Token,
    amountOut: number,
    sellAmount: number,
    poolBuyTokenReserve: number,
    poolSellTokenReserve: number,
  ) => {
    const limitOrders = limitStore.limitOrders
      .filter((order) => {
        return (
          order.isActive &&
          Number(order.expiration) > Number(chainStore.block?.height ?? 0) &&
          order.tokenIn === buyToken?.tokenId &&
          order.tokenOut === sellToken?.tokenId &&
          amountOut / sellAmount <=
            Number(order.tokenInAmount) / Number(order.tokenOutAmount)
        );
      })
      .map((order) => {
        return {
          price: Number(order.tokenInAmount) / Number(order.tokenOutAmount),
          amountIn: Number(order.tokenInAmount),
          amountOut: Number(order.tokenOutAmount),
          orderId: order.orderId,
          tokenIn: order.tokenIn,
          tokenOut: order.tokenOut,
        };
      })
      .sort((a, b) => -(a.price - b.price));

    console.log(limitOrders);

    const { amountOut: amountOutWithoutLimitOrders } = calculateSwap(
      poolBuyTokenReserve,
      poolSellTokenReserve,
      sellAmount,
    );

    console.log("amountOutWithoutLimitOrders", amountOutWithoutLimitOrders);

    let bestAmountOut = amountOutWithoutLimitOrders;

    const ordersToFill: any[] = [];
    let remainingAmountOut = sellAmount;
    let totalAmountIn = 0;

    // TODO: Implement a better algorithm like knapsack
    for (let i = 0; i < Math.min(limitOrders.length, 10); i++) {
      const order = limitOrders[i];
      if (order.amountOut <= remainingAmountOut) {
        const { amountOut } = calculateSwap(
          poolBuyTokenReserve,
          poolSellTokenReserve,
          remainingAmountOut - order.amountOut,
        );
        console.log(amountOut, order.amountIn, totalAmountIn);
        console.log(
          "amountOut + order.amountIn + totalAmountIn",
          amountOut + order.amountIn + totalAmountIn,
        );
        if (amountOut + order.amountIn + totalAmountIn > bestAmountOut) {
          ordersToFill.push(order);
          totalAmountIn += order.amountIn;
          remainingAmountOut -= order.amountOut;
          bestAmountOut = amountOut + totalAmountIn;
        }
      }
    }

    console.log("fills", ordersToFill);
    const { priceImpact } = calculateSwap(
      poolBuyTokenReserve,
      poolSellTokenReserve,
      remainingAmountOut,
    );

    return {
      ordersToFill,
      bestAmountOut,
      newPriceImpact: priceImpact,
    };
  };

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
      const sellAmount = Number(state.sellAmount) * Number(DECIMALS);

      const poolSellTokenReserve =
        pool.token0.name === sellToken?.name
          ? Number(pool.token0Amount)
          : Number(pool.token1Amount);

      const poolBuyTokenReserve =
        pool.token0.name === buyToken?.name
          ? Number(pool.token0Amount)
          : Number(pool.token1Amount);

      if (
        // sellAmount > poolSellTokenReserve ||
        sellAmount <= 0
      ) {
        setState({
          ...state,
          buyAmount: 0,
          priceImpact: "0",
        });
        setNewPool(null);
        return;
      } else {
        const { amountOut, price, priceImpact } = calculateSwap(
          poolBuyTokenReserve,
          poolSellTokenReserve,
          sellAmount,
        );
        console.table([amountOut, price, priceImpact]);
        const { ordersToFill, bestAmountOut, newPriceImpact } =
          calculateWithLimitOrders(
            buyToken!,
            sellToken!,
            amountOut,
            sellAmount,
            poolBuyTokenReserve,
            poolSellTokenReserve,
          );

        console.table([ordersToFill, bestAmountOut, newPriceImpact]);

        if (bestAmountOut > amountOut) {
          setlimitState({
            execute: true,
            ordersToFill,
            bestAmountOut: bestAmountOut,
            newPriceImpact: Number(newPriceImpact.toFixed(1)),
          });

          const limitTotalAmountIn = ordersToFill.reduce(
            (acc, order) => acc + order.amountIn,
            0,
          );

          const limitTotalAmountOut = ordersToFill.reduce(
            (acc, order) => acc + order.amountOut,
            0,
          );

          const afterPool: Pool = {
            poolId: pool.poolId,
            token0: pool.token0,
            token1: pool.token1,
            token0Amount: (
              Number(pool.token0Amount) +
              (sellAmount - limitTotalAmountIn)
            ).toString(),
            token1Amount: (
              Number(pool.token1Amount) -
              (bestAmountOut - limitTotalAmountOut)
            ).toString(),
            lpTokenSupply: pool.lpTokenSupply,
          };

          setNewPool(afterPool);
        } else {
          setlimitState({
            execute: false,
            ordersToFill: [],
            bestAmountOut: 0,
            newPriceImpact: 0,
          });

          const afterPool: Pool = {
            poolId: pool.poolId,
            token0: pool.token0,
            token1: pool.token1,
            token0Amount: (Number(pool.token0Amount) + sellAmount).toString(),
            token1Amount: (Number(pool.token1Amount) - amountOut).toString(),
            lpTokenSupply: pool.lpTokenSupply,
          };

          setNewPool(afterPool);
        }

        setState({
          ...state,
          buyAmount: amountOut,
          priceImpact: priceImpact.toFixed(2),
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
    const poolModule = client.client.runtime.resolve("PoolModule");
    if (limitState.execute) {
      const tokenIn = TokenId.from(sellToken?.tokenId);
      const tokenOut = TokenId.from(buyToken?.tokenId);
      const amountIn = Balance.from(state.sellAmount * Number(DECIMALS));
      const amountOut = Balance.from(Math.floor(limitState.bestAmountOut));
      const orderbundle = OrderBundle.empty();

      console.log("tokenIn", tokenIn.toString());
      console.log("tokenOut", tokenOut.toString());
      console.log("amountIn", amountIn.toString());
      console.log("amountOut", amountOut.toString());
      console.log("ordersToFill", limitState.ordersToFill);

      for (
        let i = 0;
        limitState.ordersToFill && i < limitState.ordersToFill.length;
        i++
      ) {
        orderbundle.bundle[i] = Field.from(limitState.ordersToFill[i].orderId);
      }
      console.log(amountIn.toString(), amountOut.toString());
      console.log(Poseidon.hash([tokenIn, tokenOut]));

      for (let i = 0; i < 10; i++) {
        console.log(orderbundle.bundle[i].toString());
      }

      const tx = await client.client.transaction(
        PublicKey.fromBase58(wallet),
        async () => {
          await poolModule.swapWithLimit(
            tokenIn,
            tokenOut,
            amountIn,
            amountOut,
            orderbundle,
          );
        },
      );
      await tx.sign();
      await tx.send();

      //@ts-ignore
      walletStore.addPendingTransaction(tx.transaction);
    } else {
      const tokenIn = TokenId.from(sellToken?.tokenId);
      const tokenOut = TokenId.from(buyToken?.tokenId);
      const amountIn = Balance.from(state.sellAmount * Number(DECIMALS));
      const amountOut = Balance.from(Math.floor(state.buyAmount));

      console.log(amountIn.toString(), amountOut.toString());
      console.log(Poseidon.hash([tokenIn, tokenOut]));

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
    }
  };
  return (
    <div className="mx-auto -mt-32 h-full pt-16">
      <div className="flex h-full w-full items-center justify-center pt-16">
        <div className="flex basis-4/12 flex-col items-center justify-center 2xl:basis-3/12">
          <Card className="flex w-full flex-col items-center border-0 p-4 shadow-none">
            <div className="mb-2 flex flex-row items-center justify-center gap-2">
              <h2 className="text-2xl font-bold">Swap</h2>
              <Route className="h-6 w-6"></Route>
            </div>

            <div className="flex flex-row items-center rounded-2xl border p-4">
              <Label className="text-custom-input px-3 text-sm">
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
                  <img src={`/${state.sellToken}.png`} className=" h-4 w-4" />
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

            <div className=" flex flex-row items-center rounded-2xl border p-4">
              <Label className="text-custom-input px-3 text-sm">
                Buy
                <CustomInput
                  value={Number(
                    (state.buyAmount / Number(DECIMALS)).toFixed(2),
                  )}
                  readOnly
                  placeholder={"0"}
                  pattern="^[0-9]*[.,]?[0-9]*$"
                  minLength={1}
                  maxLength={40}
                  inputMode="decimal"
                  type="number"
                />
                {limitState.execute ? (
                  <p className=" text-xl text-green-600">
                    <span className=" text-xs">With LimitSwap:</span>{" "}
                    {(limitState.bestAmountOut / Number(DECIMALS)).toFixed(2)}
                  </p>
                ) : null}
                <p
                  className={
                    Number(state.priceImpact) > 30
                      ? " text-red-600"
                      : Number(state.priceImpact) > 10
                        ? " text-orange-400"
                        : " "
                  }
                >
                  Price Impact: {state.priceImpact} %
                </p>
                {limitState.execute ? (
                  <p className=" text-green-600">
                    <span className=" text-xs">With LimitSwap:</span>{" "}
                    {limitState.newPriceImpact} %
                  </p>
                ) : null}
              </Label>

              <Select
                value={state.buyToken}
                onValueChange={(value) => {
                  setState({ ...state, buyToken: value });
                }}
              >
                <SelectTrigger className=" w-60 rounded-2xl">
                  <img src={`/${state.buyToken}.png`} className=" h-4 w-4" />
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
              {wallet
                ? pool
                  ? limitState.execute
                    ? "LimitLeSwap!"
                    : "Swap"
                  : "Pool Not Found"
                : "Connect wallet"}
            </Button>

            {seePoolDetails && pool ? (
              <>
                <div className="mt-2 flex w-full justify-start px-2">
                  <p
                    className=" text-custom-input cursor-pointer text-sm"
                    onClick={() => {
                      setSeePoolDetails(false);
                    }}
                  >
                    Hide Impact Chart
                  </p>
                </div>
                <PoolRatio
                  pool={pool}
                  newPool={newPool ? newPool : undefined}
                />
              </>
            ) : (
              <div className="mt-2 flex w-full justify-start px-2">
                <p
                  className=" text-custom-input cursor-pointer text-sm"
                  onClick={() => {
                    setSeePoolDetails(true);
                  }}
                >
                  Show Impact Chart
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
