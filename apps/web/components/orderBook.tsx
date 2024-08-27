"use client";
import React from "react";
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
const chartData = [
  { price: "2", amount: 186 },
  { price: "3", amount: 305 },
  { price: "4", amount: 237 },
  { price: "5", amount: 73 },
  { price: "6", amount: 209 },
  { price: "7", amount: 214 },
  { price: "8", amount: 76 },
  { price: "9", amount: 296 },
];
const chartConfig = {
  amount: {
    label: "Amount",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function OrderBook() {
  return (
    <Card className=" basis-1/2 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
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
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
              hide
            />
            <XAxis dataKey="amount" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="amount"
              layout="vertical"
              fill="var(--color-amount)"
              radius={4}
            >
              <LabelList
                dataKey="price"
                position="insideLeft"
                offset={8}
                className="fill-[--color-label]"
                fontSize={12}
              />
              <LabelList
                dataKey="amount"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
