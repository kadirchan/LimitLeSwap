import React from "react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LabelList, Pie, PieChart } from "recharts";
import { DECIMALS } from "@/lib/constants";
import { Pool } from "@/lib/stores/poolStore";

const chartConfig = {
  amount: {
    label: "Amount",
  },
  MINA: {
    label: "MINA",
    color: "hsl(272.1 71.7% 47.1%)",
  },
  USDT: {
    label: "USDT",
    color: "hsl(142.1 76.2% 36.3%)",
  },
  ETH: {
    label: "ETH",
    color: "hsl(198.6 88.7% 48.4%)",
  },
  BTC: {
    label: "BTC",
    color: "hsl(20.5 90.2% 48.2%)",
  },
} satisfies ChartConfig;

export default function PoolRatio({
  pool,
  newPool,
}: {
  pool: Pool;
  newPool?: Pool;
}) {
  const data = [
    {
      token: pool.token0.name,
      amount: Number(pool.token0Amount) / Number(DECIMALS),
      fill: `var(--color-${pool.token0.name})`,
    },
    {
      token: pool.token1.name,
      amount: Number(pool.token1Amount) / Number(DECIMALS),
      fill: `var(--color-${pool.token1.name})`,
    },
  ];
  let newPoolData: any = [];
  if (newPool) {
    newPoolData = [
      {
        token: newPool.token0.name,
        amount: Number(newPool.token0Amount) / Number(DECIMALS),
        fill: `var(--color-${newPool.token0.name})`,
      },
      {
        token: newPool.token1.name,
        amount: Number(newPool.token1Amount) / Number(DECIMALS),
        fill: `var(--color-${newPool.token1.name})`,
      },
    ];
    console.log(newPoolData);
  }
  return (
    <div className="flex flex-col items-center">
      <ChartContainer
        config={chartConfig}
        className=" mx-auto aspect-square max-h-[256px] w-64"
      >
        <PieChart>
          <ChartTooltip
            content={<ChartTooltipContent nameKey="amount" hideLabel />}
          />
          <Pie
            data={data}
            dataKey="amount"
            outerRadius={80}
            isAnimationActive={false}
            stroke="white"
          >
            <LabelList
              dataKey="token"
              className="fill-background"
              stroke="none"
              fontSize={10}
              formatter={(value: keyof typeof chartConfig) =>
                chartConfig[value]?.label
              }
            />
          </Pie>
          {newPool && (
            <Pie
              data={newPoolData}
              dataKey="amount"
              innerRadius={90}
              outerRadius={120}
              isAnimationActive={false}
              stroke="white"
            />
          )}
        </PieChart>
      </ChartContainer>
      <p></p>
    </div>
  );
}
