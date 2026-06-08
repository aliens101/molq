# MolQ

MolQ is a Mantle USDe vault with an Aave V3 Shield sleeve and a guarded Bybit
ETHUSDT hedge executor. Depositors receive ERC-4626 `mqUSDe` shares and retain
permissionless custody through on-chain deposits and redemptions.

## Architecture

- `apps/web` - React dapp with real Mantle wallet approval, deposit, and redeem flows.
- `apps/api` - live vault and market reads, guarded Bybit execution, and vault keeper routes.
- `apps/indexer` - Ponder indexer for ERC-4626 transfers, vault operations, and agent decisions.
- `contracts` - Foundry contracts and Mantle fork tests.
- `packages/shared` - shared addresses, response models, and chain constants.

## Mantle Mainnet

- MolqVault: `0x71711F35c200fDabE75F2e82F0146c35f32eBAA5`
- MolqDecisionLogger: `0xb6e5499C97138Ee6E25d1E904b6714BD0E60f139`
- USDe: `0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34`
- Aave V3 Pool: `0x458F293454fE0d67EC0655f3672301301DD51422`
- Aave aUSDe: `0xb9aCA933C9c0aa854a6DBb7b12f0CC3FdaC15ee7`

Deployment transactions and explorer links are in
`deployments/mantle-mainnet.json`.

## Execution Model

The vault targets 85% Shield and 15% liquid capital:

- Shield capital is supplied directly to Aave V3 USDe on Mantle.
- Liquid capital remains in the vault for Alpha operations.
- A keeper can rebalance the vault to its configured target.
- The backend can reconcile a separately funded Bybit ETHUSDT short.

Bybit trading and keeper writes are default-disabled. They require dedicated
credentials and explicit enable flags in `apps/api/.env`.

## Local Development

```sh
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/indexer/.env.example apps/indexer/.env.local
pnpm dev:all
```

The web app runs at `http://localhost:5173` and proxies `/api` to
`http://localhost:8787`.

## Validation

```sh
pnpm build
pnpm test
pnpm format:check
```

`pnpm test` includes a Mantle fork test that deposits real forked USDe into
Aave V3 through `MolqVault` and redeems it.

## Operational Limits

- The deployed vault currently has no deposited TVL.
- Live Bybit order placement requires `BYBIT_API_KEY`, `BYBIT_API_SECRET`, and
  `BYBIT_TRADING_ENABLED=true`.
- Vault automation requires a dedicated on-chain keeper signer,
  `MOLQ_KEEPER_PRIVATE_KEY`, and `MOLQ_KEEPER_ENABLED=true`.
- Operator write routes require `MOLQ_OPERATOR_API_KEY`.
