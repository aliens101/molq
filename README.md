# MolQ

MolQ is an AI-managed Mantle CeDeFi yield agent. This local MVP runs a complete deposit, simulated
basis-yield, profit-harvest, and hardening flow.

- `apps/web` — Vite React dapp copied from the Squarex web foundation and repurposed for MolQ.
- `apps/api` — deterministic strategy API and simulation engine.
- `apps/indexer` — Ponder indexer for MolQ vault and AI decision events.
- `contracts` — Foundry smart contracts for vault accounting and on-chain AI decision logs.
- `packages/shared` — shared TypeScript package placeholder for cross-app types/constants.

## Local development

```sh
pnpm install
pnpm dev
```

The web app runs at `http://localhost:5173` and proxies `/api` to the backend at
`http://localhost:8787`.

After deploying contracts, copy `apps/indexer/.env.example` to `apps/indexer/.env.local`, fill
`PONDER_MOLQ_DECISION_LOGGER`, `PONDER_MOLQ_VAULT`, and `PONDER_START_BLOCK`, then run:

```sh
pnpm indexer
```

Ponder serves GraphQL and SQL APIs on its own local HTTP server.

## Mantle mainnet demo deployment

Public deployment metadata is stored in `deployments/mantle-mainnet.json`.

- Mock USDe: `0x0A2BBe66B0A9987171De6c063FAeFd28Ccf9474D`
- MolqDecisionLogger: `0xb6e5499C97138Ee6E25d1E904b6714BD0E60f139`
- MolqVault: `0x626599904E04d8eED214740e39F380A4D5B0aDC3`

## Validation

```sh
pnpm build
pnpm test
pnpm format
pnpm format:check
```
