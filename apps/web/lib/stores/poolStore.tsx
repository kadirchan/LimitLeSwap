import { Field, Provable, Struct } from "o1js";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const ORDER_BUNDLE = 10;
export class OrderBundle extends Struct({
  bundle: Provable.Array(Field, ORDER_BUNDLE),
}) {
  public static empty(): OrderBundle {
    const bundle = Array<Field>(10).fill(Field.from(0));
    return new OrderBundle({ bundle });
  }
}

export interface Token {
  name: string;
  icon: string;
  tokenId: string;
}

export interface Pool {
  poolId: string;
  token0: Token;
  token1: Token;
  token0Amount: string;
  token1Amount: string;
  lpTokenSupply: string;
}

export interface Position {
  poolId: string;
  token0: Token;
  token1: Token;
  token0Amount: string;
  token1Amount: string;
  lpTokenAmount: string;
  lpTokenTotalSupply: string;
}

export interface PoolState {
  isSet: boolean;
  tokenList: Token[];
  poolList: Pool[];
  positionList: Position[];

  setTokenList: (tokenList: Token[]) => void;
  setPoolList: (poolList: Pool[]) => void;

  setPositionList: (positionList: Position[]) => void;
}

export const usePoolStore = create<PoolState, [["zustand/immer", never]]>(
  immer((set) => ({
    isSet: false,
    tokenList: [],
    poolList: [],
    positionList: [],

    setTokenList: (_tokenList: Token[]) => set({ tokenList: _tokenList }),
    setPoolList: (_poolList: Pool[]) => set({ poolList: _poolList }),
    setPositionList: (_positionList: Position[]) =>
      set({ positionList: _positionList }),
  })),
);
