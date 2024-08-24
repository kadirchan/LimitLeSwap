import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Client, useClientStore } from "./client";
import { useWalletStore } from "./wallet";
import { useChainStore } from "./chain";
import { useEffect } from "react";
import { Bool, Field, PublicKey } from "o1js";

export interface LimitOrder {
  orderId: number;
  expiration: string;
  isActive: boolean;
  tokenIn: string;
  tokenInAmount: string;
  tokenOut: string;
  tokenOutAmount: string;
  owner: PublicKey;
}

export interface LimitState {
  limitOrders: LimitOrder[];
  setLimitOrders: (limitOrders: LimitOrder[]) => void;
  loadOrders: (client: Client) => Promise<void>;
}

export const useLimitStore = create<LimitState, [["zustand/immer", never]]>(
  immer((set) => ({
    limitOrders: [],
    setLimitOrders: (_limitOrders: LimitOrder[]) =>
      set({ limitOrders: _limitOrders }),

    async loadOrders(client: Client) {
      let orderCount = await client.query.runtime.LimitOrders.orderNonce.get();
      orderCount = orderCount.value[1][1].toString();

      const limitOrders: LimitOrder[] = [];

      for (let i = 0; i < Number(orderCount); i++) {
        const order = await client.query.runtime.LimitOrders.orders.get(
          Field.from(i),
        );

        limitOrders.push({
          orderId: i,
          expiration: Field.fromJSON(order.expiration).toString(),
          isActive: Bool.fromJSON(order.isActive).toBoolean(),
          tokenIn: Field.fromJSON(order.tokenIn).toString(),
          tokenInAmount: Field.fromJSON(order.tokenInAmount).toString(),
          tokenOut: Field.fromJSON(order.tokenOut).toString(),
          tokenOutAmount: Field.fromJSON(order.tokenOutAmount).toString(),
          owner: PublicKey.fromJSON(order.owner.toJSON()),
        });
      }

      console.log(limitOrders);
      set({ limitOrders });
    },
  })),
);

export const useObserveOrders = () => {
  const client = useClientStore();
  const chain = useChainStore();
  const limitStore = useLimitStore();
  const wallet = useWalletStore();

  useEffect(() => {
    if (!client.client || !wallet.wallet) return;

    limitStore.loadOrders(client.client);
  }, [client.client, chain.block?.height, wallet.wallet]);
};
