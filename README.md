# MolQ

MolQ is an AI-managed Mantle CeDeFi yield agent. This local MVP runs a complete deposit, simulated
basis-yield, profit-harvest, and hardening flow, enriched with live Mantle market data.

- `apps/web` — Vite React dapp copied from the Squarex web foundation and repurposed for MolQ.
- `apps/api` — deterministic strategy API, simulation engine, and protocol market adapters.
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

If `5173` is already occupied, Vite will choose the next available port.

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
- InitUsdeShieldReader: `0x8EF74637d34bf98ea3F34502a512327aFC9789c3`

The reader is verified on Mantlescan and calls the live INIT Capital USDe lending pool:
`0x3282437C436eE6AA9861a6A46ab0822d82581b1c`.

## Protocol integrations

MolQ currently integrates two execution venues:

- Shield: INIT Capital USDe lending pool on Mantle mainnet. The API reads supply rate, available
  liquidity, total assets, and underlying token using `viem`; the on-chain reader exposes the same
  pool snapshot as a Solidity view.
- Alpha: Bybit ETHUSDT perpetual funding signal. The API reads the public ticker endpoint when
  available and falls back to a deterministic funding estimate when the endpoint is unreachable.

The vault custody path is still intentionally local to `MolqVault`. Direct INIT deposits require
integration through INIT Core/PosManager, because the lending pool mint and burn methods are guarded
by INIT. That is the next production step before real user funds should route into INIT.

## Validation

```sh
pnpm build
pnpm test
pnpm format
pnpm format:check
pnpm contracts:test
```
