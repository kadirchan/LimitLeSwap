import React from "react";
import { Table, TableBody, TableCell, TableRow } from "./ui/table";
import { LimitOrder, useLimitStore } from "@/lib/stores/limitStore";
import { useWalletStore } from "@/lib/stores/wallet";
import { usePoolStore } from "@/lib/stores/poolStore";
import { useChainStore } from "@/lib/stores/chain";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useClientStore } from "@/lib/stores/client";
import { Field, PublicKey } from "o1js";
import { DECIMALS } from "@/lib/constants";

export default function MyOrders() {
  const walletStore = useWalletStore();
  const limitStore = useLimitStore();
  const poolStore = usePoolStore();
  const chainStore = useChainStore();
  const client = useClientStore();

  const cancelOrder = async (order: LimitOrder) => {
    if (client.client && walletStore.wallet) {
      const limitOrderModule = client.client.runtime.resolve("LimitOrders");

      const tx = await client.client.transaction(
        PublicKey.fromBase58(walletStore.wallet),
        async () => {
          await limitOrderModule.cancelLimitOrder(Field.from(order.orderId));
        },
      );
      await tx.sign();
      await tx.send();

      //@ts-ignore
      walletStore.addPendingTransaction(tx.transaction);
    }
  };
  return (
    <Card className="flex w-full flex-col rounded-2xl shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">My Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className=" h-40">
          <Table>
            <TableBody>
              {limitStore.limitOrders
                .filter(
                  (limitOrder) =>
                    limitOrder.owner.toBase58() === walletStore.wallet &&
                    limitOrder.isActive &&
                    Number(limitOrder.expiration) >
                      Number(chainStore.block?.height ?? 0),
                )
                .map((limitOrder) => {
                  const tokenIn = poolStore.tokenList.find(
                    (token) => token.tokenId === limitOrder.tokenIn,
                  );
                  const tokenOut = poolStore.tokenList.find(
                    (token) => token.tokenId === limitOrder.tokenOut,
                  );

                  return (
                    <TableRow
                      className=" flex flex-row items-center justify-between"
                      key={limitOrder.orderId}
                    >
                      <TableCell className="flex flex-col px-1 py-4">
                        <div>
                          <span className=" font-medium text-red-600">
                            Sell
                          </span>{" "}
                          {Number(limitOrder.tokenInAmount) / Number(DECIMALS)}{" "}
                          {tokenIn?.name}{" "}
                        </div>
                        <div>
                          <span className=" font-medium text-green-600">
                            For
                          </span>{" "}
                          {Number(limitOrder.tokenOutAmount) / Number(DECIMALS)}{" "}
                          {tokenOut?.name}
                        </div>
                        <div className=" text-sm">
                          <span className=" text-sm font-normal">
                            {" "}
                            Valid until:{" "}
                          </span>
                          {limitOrder.expiration}
                        </div>
                      </TableCell>

                      <TableCell className="flex p-0">
                        <Button
                          variant={"hover"}
                          className=" flex items-center justify-center text-sm"
                          onClick={() => {
                            cancelOrder(limitOrder);
                          }}
                        >
                          Cancel <X className=" h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
