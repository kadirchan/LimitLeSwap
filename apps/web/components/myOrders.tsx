import React from "react";
import { Table, TableBody, TableCell, TableRow } from "./ui/table";
import { useLimitStore } from "@/lib/stores/limitStore";
import { useWalletStore } from "@/lib/stores/wallet";
import { usePoolStore } from "@/lib/stores/poolStore";
import { useChainStore } from "@/lib/stores/chain";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function MyOrders() {
  const walletStore = useWalletStore();
  const limitStore = useLimitStore();
  const poolStore = usePoolStore();
  const chainStore = useChainStore();
  return (
    <Card className="flex flex-1 basis-1/2 flex-col rounded-2xl">
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
                      <TableCell className="flex flex-col px-1 py-4 font-bold">
                        <div>
                          <span className=" font-medium">Sell</span>{" "}
                          {limitOrder.tokenInAmount} {tokenIn?.name}{" "}
                        </div>
                        <div>
                          <span className=" font-medium">For</span>{" "}
                          {limitOrder.tokenOutAmount} {tokenOut?.name}
                        </div>
                        <div className=" text-sm">
                          Valid until :{limitOrder.expiration}
                        </div>
                      </TableCell>

                      <TableCell className="flex p-0">
                        <Button
                          variant={"hover"}
                          className=" flex items-center justify-center text-sm"
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
