import { Button } from "@/components/ui/button";
// @ts-ignore
import truncateMiddle from "truncate-middle";
import { Skeleton } from "@/components/ui/skeleton";
import { Chain } from "./chain";
import { Separator } from "./ui/separator";
import { ArrowRightLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useBalancesStore } from "@/lib/stores/balances";
import { usePoolStore } from "@/lib/stores/poolStore";
import { ModeToggle } from "./mode-toggle";

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
  const balances = useBalancesStore();
  const poolStore = usePoolStore();
  return (
    <div className="shadow-xs flex items-center justify-between border-b p-4 py-6">
      <div className="container flex">
        <div className="flex basis-6/12 items-center justify-start">
          <ArrowRightLeft className="h-8 w-8 -rotate-45" />
          <p
            className="ml-2 cursor-pointer text-xl font-bold"
            onClick={() => {
              handleNavigate("/");
            }}
          >
            LimitLe Swap
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
          <Popover>
            <PopoverTrigger>
              <Button variant={"hover"} className="text-md">
                Pool
              </Button>
            </PopoverTrigger>
            <PopoverContent className="flex w-48 flex-col gap-4 rounded-2xl p-1">
              <Button
                variant={"hover"}
                className="text-md rounded-2xl hover:bg-gray-100"
                onClick={() => {
                  handleNavigate("/create-pool");
                }}
              >
                Create Pool
              </Button>
              <Button
                variant={"hover"}
                className="text-md rounded-2xl hover:bg-gray-100"
                onClick={() => {
                  handleNavigate("/add-liquidity");
                }}
              >
                Add Liquidity
              </Button>
              <Button
                variant={"hover"}
                className="text-md rounded-2xl hover:bg-gray-100"
                onClick={() => {
                  handleNavigate("/remove-liquidity");
                }}
              >
                Remove Liquidity
              </Button>
              <Button
                variant={"hover"}
                className="text-md rounded-2xl hover:bg-gray-100"
                onClick={() => {
                  handleNavigate("/positions");
                }}
              >
                Positions
              </Button>
            </PopoverContent>
          </Popover>
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
          {wallet && (
            <div className="mr-4 flex shrink flex-col items-end justify-center">
              <div>
                <p className="text-xs">Your balance</p>
              </div>
              <div className="w-32 pt-0.5 text-right">
                {balanceLoading && balance === undefined ? (
                  <Skeleton className="h-4 w-full" />
                ) : (
                  <Popover>
                    <PopoverTrigger>
                      <p className="text-xs font-bold">
                        {balances.balances["MINA"]} MINA
                      </p>
                    </PopoverTrigger>
                    <PopoverContent className="flex flex-col gap-4 p-4">
                      {poolStore.tokenList.map((token) => {
                        return (
                          <p key={token.name} className="text-xs font-bold">
                            {balances.balances[token.name]} {token.name}
                          </p>
                        );
                      })}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          )}
          <Button
            loading={loading}
            className="w-32 rounded-2xl"
            onClick={onConnectWallet}
          >
            <div>
              {wallet ? truncateMiddle(wallet, 4, 4, "...") : "Connect wallet"}
            </div>
          </Button>
          <ModeToggle />
        </div>
      </div>
      <div className=" fixed bottom-2 right-2 p-2">
        <Chain height={blockHeight} />
      </div>
    </div>
  );
}
