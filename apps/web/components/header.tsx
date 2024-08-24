import { Button } from "@/components/ui/button";
import protokit from "@/public/protokit-zinc.svg";
import Image from "next/image";
// @ts-ignore
import truncateMiddle from "truncate-middle";
import { Skeleton } from "@/components/ui/skeleton";
import { Chain } from "./chain";
import { Separator } from "./ui/separator";
import { ArrowRightLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export interface HeaderProps {
  loading: boolean;
  wallet?: string;
  onConnectWallet: () => void;
  balance?: string;
  balanceLoading: boolean;
  blockHeight?: string;
}

export default function Header({
  loading,
  wallet,
  onConnectWallet,
  balance,
  balanceLoading,
  blockHeight,
}: HeaderProps) {
  const router = useRouter();
  const handleNavigate = (path: string) => {
    router.push(path);
  };
  return (
    <div className="flex items-center justify-between border-b p-2 shadow-sm">
      <div className="container flex">
        <div className="flex basis-6/12 items-center justify-start">
          <ArrowRightLeft className="h-8 w-8 -rotate-45" />
          <p
            className="ml-2 cursor-pointer text-xl font-bold"
            onClick={() => {
              handleNavigate("/");
            }}
          >
            Todo Swap
          </p>
          <Separator className="mx-4 h-8" orientation={"vertical"} />
          <Button
            variant={"hover"}
            className="text-md"
            onClick={() => {
              handleNavigate("/swap");
            }}
          >
            Swap
          </Button>
          <Button
            variant={"hover"}
            className="text-md"
            onClick={() => {
              handleNavigate("/limit-order");
            }}
          >
            Limit Order
          </Button>
          <Button
            variant={"hover"}
            className="text-md"
            onClick={() => {
              handleNavigate("/pool");
            }}
          >
            Pool
          </Button>
          <Button
            variant={"hover"}
            className="text-md"
            onClick={() => {
              handleNavigate("/faucet");
            }}
          >
            Faucet
          </Button>
        </div>
        <div className="flex basis-6/12 flex-row items-center justify-end">
          {/* balance */}
          {wallet && (
            <div className="mr-4 flex shrink flex-col items-end justify-center">
              <div>
                <p className="text-xs">Your balance</p>
              </div>
              <div className="w-32 pt-0.5 text-right">
                {balanceLoading && balance === undefined ? (
                  <Skeleton className="h-4 w-full" />
                ) : (
                  <p className="text-xs font-bold">{balance} MINA</p>
                )}
              </div>
            </div>
          )}
          {/* connect wallet */}
          <Button loading={loading} className="w-44" onClick={onConnectWallet}>
            <div>
              {wallet ? truncateMiddle(wallet, 7, 7, "...") : "Connect wallet"}
            </div>
          </Button>
        </div>
      </div>
      <div className=" fixed bottom-2 right-2 p-2">
        <Chain height={blockHeight} />
      </div>
    </div>
  );
}
