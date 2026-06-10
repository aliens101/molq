# MolQ

MolQ is an autonomous CeDeFi yield agent for USDe on Mantle. Users deposit USDe
into a permissionless ERC-4626 vault and receive `mqUSDe` shares. MolQ combines
an Aave V3 yield sleeve with a policy-capped Bybit ETHUSDT short hedge, while
model decisions and agent identity are recorded on Mantle.

## Live Deployment

- Landing: https://molq.site
- Dapp: https://app.molq.site
- Documentation: https://docs.molq.site
- API health: https://api.molq.site/api/health
- Ponder GraphQL: https://indexer.molq.site/graphql
- Network: Mantle mainnet (`5000`)

Production is deployed from `main` by
[GitHub Actions](https://github.com/aliens101/molq/actions). Nginx terminates
HTTPS, PM2 runs the API and indexer, and PostgreSQL stores indexed data.

## Product Flow

1. A user approves and deposits USDe into `MolqVault`.
2. The vault mints transferable ERC-4626 `mqUSDe` shares.
3. The keeper targets 85% Aave V3 USDe and 15% liquid capital.
4. The agent reads live vault, Aave, Bybit, and execution state.
5. The model proposes an action within deterministic risk constraints.
6. Approved actions can rebalance Aave or reconcile the separately funded
   Bybit hedge.
7. Decisions are committed to `MolqDecisionLogger` and indexed by Ponder.
8. Users can redeem their shares permissionlessly through the vault.

Bybit collateral is operational capital and is not transferred from the vault
by the smart contract. Trading and keeper writes are independently gated.

## APY Semantics

The dashboard shows live market inputs and a projected policy-target APY:

```text
projected APY =
  (Aave USDe supply APY x 85%) +
  (ETHUSDT short funding APY x 15%)
```

For a short perpetual position:

- Positive funding means longs pay shorts, so the hedge receives carry.
- Negative funding means shorts pay longs, so the hedge has a carry cost.

For example, `0.61%` Aave APY and `-5.71%` short funding APY produce:

```text
(0.61% x 85%) + (-5.71% x 15%) = -0.34%
```

This is not realized performance and does not mean an empty vault is losing
money. It estimates the current opportunity if the full 85/15 target were
deployed at the latest funding rate. Funding changes every eight hours, and
MolQ's policy can hold zero hedge exposure when carry is unattractive. Realized
profit is reported separately.

## Architecture

- `apps/landing` - public protocol site with live API data and GSAP motion.
- `apps/web` - React dapp for wallet connection, deposits, redemptions, vault
  state, execution state, and agent activity.
- `apps/api` - live Aave and Bybit reads, agent runtime, guarded hedge
  execution, vault keeper, and operator routes.
- `apps/indexer` - Ponder indexer and GraphQL API for vault events, ERC-8004
  identity, and on-chain decisions.
- `apps/docs` - Mintlify user, protocol, API, and developer documentation.
- `contracts` - Foundry contracts, deployment scripts, unit tests, and Mantle
  fork tests.
- `packages/shared` - contract addresses, chain constants, and shared types.
- `deploy` - PM2 and Nginx production configuration.
- `scripts/deploy-vps.sh` - reproducible VPS build and release script.

## Mantle Contracts

| Contract                   | Address                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| MolqVault                  | [`0xBcBe5DE4D9F8F9336924eCB90888a775DfB06Eb9`](https://mantlescan.xyz/address/0xBcBe5DE4D9F8F9336924eCB90888a775DfB06Eb9#code) |
| MolqDecisionLogger         | [`0x24df9c33D24D7C84e527D247D25a203490001Be9`](https://mantlescan.xyz/address/0x24df9c33D24D7C84e527D247D25a203490001Be9#code) |
| ERC-8004 Identity Registry | [`0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`](https://mantlescan.xyz/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=112)  |
| USDe                       | `0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34`                                                                                   |
| Aave V3 Pool               | `0x458F293454fE0d67EC0655f3672301301DD51422`                                                                                   |
| Aave aUSDe                 | `0xb9aCA933C9c0aa854a6DBb7b12f0CC3FdaC15ee7`                                                                                   |

MolQ's ERC-8004 agent ID is `112`. Deployment transactions and verification
evidence are stored in `deployments/mantle-mainnet.json`.

## Safety Model

- Deposits and redemptions remain on-chain and permissionless.
- The model cannot bypass deterministic action, risk, or notional limits.
- Bybit trading is disabled unless credentials and
  `BYBIT_TRADING_ENABLED=true` are present.
- Keeper writes require `MOLQ_KEEPER_ENABLED=true` and an authorized signer.
- Agent writes require `MOLQ_AGENT_WRITES_ENABLED=true`.
- Operator routes require `MOLQ_OPERATOR_API_KEY`.
- Hedge notional, leverage, slippage, risk score, and minimum funding carry are
  configurable.
- Every accepted decision can be logged on-chain and independently indexed.

## Local Development

Requirements: Node.js 20, pnpm 10, Foundry, and PostgreSQL for Ponder.

```sh
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/indexer/.env.example apps/indexer/.env.local
pnpm dev:all
```

Run the landing page separately with:

```sh
pnpm landing
```

Run the Mintlify documentation with:

```sh
pnpm docs
```

Default local endpoints:

- Dapp: `http://localhost:5173`
- Landing: `http://localhost:5174`
- API: `http://localhost:8787`
- Ponder: `http://localhost:42069`
- Docs: `http://localhost:3000`

Keep private keys and API credentials in untracked environment files. Never
commit production secrets.

## Validation

```sh
pnpm build
pnpm test
pnpm docs:check
pnpm format:check
```

The test suite covers API policy and execution behavior, web and landing
components, Solidity contracts, and a Mantle fork flow that deposits real
forked USDe into Aave V3 through `MolqVault` and redeems it.

## Deployment

Every push to `main`:

1. Installs pnpm and pinned Foundry dependencies.
2. Builds all applications and contracts.
3. Validates Mintlify configuration and documentation links.
4. Runs the complete test suite.
5. Connects to the VPS over SSH.
6. Publishes versioned static landing and dapp releases.
7. Recreates the MolQ PM2 API and indexer processes.
8. Verifies local service health before completing.

Mintlify deploys `apps/docs` separately through its GitHub App. Configure the
Mintlify project to use `aliens101/molq`, enable monorepo mode, and set the docs
path to `/apps/docs`.

The production deployment script is defensive and affects only the
`molq-api` and `molq-indexer` PM2 processes.

## Current Status

- Mantle contracts are deployed and verified.
- Aave V3 market reads and vault integration are live.
- Bybit market and authenticated account reads are live.
- Bybit order placement remains policy-gated.
- The OpenAI-backed agent runs on a five-minute interval.
- ERC-8004 identity and decision logging are live.
- Ponder is synchronized with Mantle mainnet.
- The vault has a live mainnet deposit allocated to Aave according to policy.

Hackathon positioning, demo flow, and the submission checklist are available in
[`docs/HACKATHON_SUBMISSION.md`](docs/HACKATHON_SUBMISSION.md).
