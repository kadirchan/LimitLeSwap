import { create } from "zustand";
import { Client, useClientStore } from "./client";
import { immer } from "zustand/middleware/immer";
import { PendingTransaction, UnsignedTransaction } from "@proto-kit/sequencer";
import { Balance, BalancesKey, TokenId } from "@proto-kit/library";
import { PublicKey } from "o1js";
import { useCallback, useEffect } from "react";
import { useChainStore } from "./chain";
import { useWalletStore } from "./wallet";
import { Token, usePoolStore } from "./poolStore";
import { DECIMALS } from "../constants";

export interface BalancesState {
  loading: boolean;
  balances: {
    // address - balance
    [key: string]: string;
  };
  faucetTokenId: string;
  setFaucetTokenId: (tokenId: string) => void;
  loadBalance: (
    client: Client,
    address: string,
    tokenId: Token,
  ) => Promise<void>;
  faucet: (
    client: Client,
    address: string,
    token: TokenId,
  ) => Promise<PendingTransaction>;
}

function isPendingTransaction(
  transaction: PendingTransaction | UnsignedTransaction | undefined,
): asserts transaction is PendingTransaction {
  if (!(transaction instanceof PendingTransaction))
    throw new Error("Transaction is not a PendingTransaction");
}

export const useBalancesStore = create<
  BalancesState,
  [["zustand/immer", never]]
>(
  immer((set) => ({
    loading: Boolean(false),
    balances: {},
    faucetTokenId: "0",
    setFaucetTokenId: (tokenId: string) => set({ faucetTokenId: tokenId }),

    async loadBalance(client: Client, address: string, token: Token) {
      set((state) => {
        state.loading = true;
      });

      const tokenId = TokenId.from(token.tokenId);
      const key = BalancesKey.from(tokenId, PublicKey.fromBase58(address));
      const balance = await client.query.runtime.Balances.balances.get(key);

      set((state) => {
        state.loading = false;
        state.balances[token.name] = balance?.toString() ?? "0";
      });
    },
    async faucet(client: Client, address: string, tokenId: TokenId) {
      const balances = client.runtime.resolve("Balances");
      const sender = PublicKey.fromBase58(address);
      console.log("Faucet", tokenId.toString());
      console.log(tokenId);

      const tx = await client.transaction(sender, async () => {
        const amount = BigInt(1000) * DECIMALS;
        await balances.mintToken(tokenId, sender, Balance.from(amount));
      });

      await tx.sign();
      await tx.send();

      isPendingTransaction(tx.transaction);
      return tx.transaction;
    },
  })),
);

export const useObserveBalance = () => {
  const client = useClientStore();
  const chain = useChainStore();
  const wallet = useWalletStore();
  const balances = useBalancesStore();
  const poolStore = usePoolStore();

  useEffect(() => {
    if (!client.client || !wallet.wallet) return;

    for (const tokenId of poolStore.tokenList) {
      balances.loadBalance(client.client, wallet.wallet, tokenId);
    }
  }, [client.client, chain.block?.height, wallet.wallet, poolStore.tokenList]);
};

export const useFaucet = () => {
  const client = useClientStore();
  const balances = useBalancesStore();
  const wallet = useWalletStore();

  return useCallback(async () => {
    if (!client.client || !wallet.wallet) return;

    const pendingTransaction = await balances.faucet(
      client.client,
      wallet.wallet,
      TokenId.from(balances.faucetTokenId),
    );

    wallet.addPendingTransaction(pendingTransaction);
  }, [client.client, wallet.wallet, balances.faucetTokenId]);
};
