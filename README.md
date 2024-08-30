# LimitLe Swap
LimitLeSwap is a DEX-appchain where users can leverage Mina to make the most efficient use of AMM and Order book exchanges at the same time.

## Project Description
This project tries to maximize user benefit by combining the best points of the AMM and Order book systems we are used to. Users can generate income by adding their assets to liquidity pools and use these pools to execute swaps. However, unlike regular AMM DEXs, LimitLeSwap's hybrid order system for swap execution allows users to utilize limit orders in the order book for optimal output. This allows both buyers and sellers to execute trades at their desired price with much less price impact. All this is executed at very high trading speeds on Mina L2 by utilizing Protokit.

## How It Is Made
This project uses Protokit for app-chain customized for its unique purpose. In this way, it can utilize both the zero knowledge proofs of Mina's o1js library and the built-in data availability, on-chain execution and sequencer features of the Protokit. Lightweight and user frontend is written in Nextjs.


## Quick start

The monorepo contains 1 package and 1 app:

- `packages/chain` contains everything related app-chain
- `apps/web` contains web UI

**Prerequisites:**

- Node.js `v18` (we recommend using NVM)
- pnpm `v9.8`
- nvm

For running with persistance / deploying on a server
- docker `>= 24.0`
- docker-compose `>= 2.22.0`

### Running in-memory

```zsh
# starts both UI and sequencer locally
pnpm env:inmemory my-dev
```

Navigate to `localhost:3000` to see the example UI, or to `localhost:8080/graphql` to see the GQL interface of the locally running sequencer.

### Running tests
```zsh
# run and watch tests for the `chain` package
pnpm run test --filter=chain -- --watchAll
```
