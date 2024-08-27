"use client";
import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { usePoolStore } from "@/lib/stores/poolStore";
import { useLimitStore } from "@/lib/stores/limitStore";
import { useChainStore } from "@/lib/stores/chain";

const chartConfig = {
  amount: {
    label: "Amount",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function OrderBook({
  tokenIn,
  tokenOut,
}: {
  tokenIn: string;
  tokenOut: string;
}) {
  const poolStore = usePoolStore();
  const limitStore = useLimitStore();
  const chainStore = useChainStore();
  const [orders, setOrders] = useState<{ price: string; amount: number }[]>([]);
  const [pair, setPair] = useState<{ tokenIn: string; tokenOut: string }>({
    tokenIn,
    tokenOut,
  });
  useEffect(() => {
    let sellToken = poolStore.tokenList.find((token) => token.name === tokenIn);
    let buyToken = poolStore.tokenList.find((token) => token.name === tokenOut);

    setPair({
      tokenIn: sellToken?.name ?? "",
      tokenOut: buyToken?.name ?? "",
    });

    if (!sellToken || !buyToken) return;

    const priceToAmount: { [key: number]: number } = {};

    const orders = limitStore.limitOrders
      .filter((order) => {
        return (
          order.isActive &&
          Number(order.expiration) > Number(chainStore.block?.height ?? 0) &&
          order.tokenIn === sellToken?.tokenId &&
          order.tokenOut === buyToken?.tokenId
        );
      })
      .map((order) => {
        return {
          price: Number(order.tokenOutAmount) / Number(order.tokenInAmount),
          amountIn: Number(order.tokenInAmount),
        };
      })
      .forEach((order) => {
        if (!priceToAmount[order.price]) {
          priceToAmount[order.price] = 0;
        }
        priceToAmount[order.price] += order.amountIn;
      });

    console.log(priceToAmount);
    const transformedArray = Object.keys(priceToAmount).map((key) => {
      return {
        price: Number(key).toFixed(2),
        amount: priceToAmount[Number(key)],
      };
    });

    setOrders(transformedArray);
  }, [tokenIn, tokenOut, limitStore.limitOrders]);
  return (
    <Card className=" w-full rounded-2xl shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">
          {pair.tokenIn} / {pair.tokenOut} Orders
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length > 0 ? (
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={orders}
              layout="vertical"
              margin={{
                right: 16,
              }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="price"
                type="category"
                tickLine={false}
                tickMargin={1}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
                hide
              />
              <XAxis dataKey="amount" type="number" hide />
              <ChartTooltip
                cursor={true}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) =>
                      value + ` ${pair.tokenIn} / ${pair.tokenOut}`
                    }
                    formatter={(value) => value + ` ${pair.tokenIn}`}
                    hideIndicator={false}
                  />
                }
              />
              <Bar
                dataKey="amount"
                layout="vertical"
                fill="hsl(142.1 76.2% 36.3%)"
                radius={4}
              >
                <LabelList
                  dataKey="price"
                  position="insideLeft"
                  offset={2}
                  className="fill-[--color-label]"
                  fontSize={10}
                />
                <LabelList
                  dataKey="amount"
                  position="right"
                  offset={4}
                  className="overflow-visible fill-foreground"
                  fontSize={10}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-zinc-500">No orders available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
