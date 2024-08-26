import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { useBalancesStore, useObserveBalance } from "@/lib/stores/balances";
import { useChainStore, usePollBlockHeight } from "@/lib/stores/chain";
import { useClientStore } from "@/lib/stores/client";
import { useObserveOrders } from "@/lib/stores/limitStore";
import { useNotifyTransactions, useWalletStore } from "@/lib/stores/wallet";
import { ReactNode, useEffect, useMemo } from "react";

export default function AsyncLayout({ children }: { children: ReactNode }) {
  const wallet = useWalletStore();
  const client = useClientStore();
  const chain = useChainStore();
  const balances = useBalancesStore();

  usePollBlockHeight();
  useObserveBalance();
  useNotifyTransactions();
  useObserveOrders();

  useEffect(() => {
    client.start();
  }, []);

  useEffect(() => {
    wallet.initializeWallet();
    wallet.observeWalletChange();
  }, []);

  const loading = useMemo(
    () => client.loading || balances.loading,
    [client.loading, balances.loading],
  );

  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="light">
        <Header
          loading={client.loading}
          balance={balances.balances[wallet.wallet ? "MINA" : ""]}
          balanceLoading={loading}
          wallet={wallet.wallet}
          onConnectWallet={wallet.connectWallet}
          blockHeight={chain.block?.height ?? "-"}
        />
        {children}
        <Toaster />
      </ThemeProvider>
    </>
  );
}
