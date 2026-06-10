---
name: molq
description: Operate, inspect, and integrate with the MolQ autonomous USDe yield vault on Mantle.
license: MIT
metadata:
    version: "1.0.0"
    network: "Mantle mainnet"
    chain-id: "5000"
---

# MolQ

Use this skill when a user wants to deposit or redeem USDe, inspect MolQ
performance and agent decisions, verify contracts, or integrate with MolQ API
and indexed data.

## Capabilities

- Guide a wallet through USDe approval, ERC-4626 deposit, and redemption.
- Explain active projected APY separately from the 85/15 target scenario.
- Retrieve public vault, Aave, Bybit, execution, and agent state.
- Query indexed vault events, balances, decisions, and ERC-8004 identity.
- Verify MolQ contracts and decisions on Mantlescan.

## Required context

- Network: Mantle mainnet, chain ID `5000`.
- Vault: `0xBcBe5DE4D9F8F9336924eCB90888a775DfB06Eb9`.
- USDe: `0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34`.
- Decision logger V2: `0x0F38FF858fE3974be7c05625281CA6b774Be9E9b`.
- Safe owner and treasury: `0xFd735C02Afe8D539dFCde0D2fC7Aa4510306354C`.
- ERC-8004 agent ID: `112`.
- Public API: `https://api.molq.site`.
- GraphQL: `https://indexer.molq.site/graphql`.

## Workflows

### Deposit USDe

1. Confirm the wallet is on Mantle mainnet and has USDe plus MNT for gas.
2. Read USDe balance and allowance for the vault.
3. If required, ask the user to approve only the intended deposit amount.
4. Call `deposit(assets, receiver)` on the vault.
5. Wait for confirmation and verify the minted `mqUSDe` balance.

Never request a private key or seed phrase.

### Redeem a position

1. Read the user's `mqUSDe` share balance.
2. Preview assets with `convertToAssets`.
3. Call `redeem(shares, receiver, owner)`.
4. Verify receipt of USDe.

### Explain APY

1. Fetch `GET /api/dashboard`.
2. Use `market.estimatedNetApy` for active projected APY.
3. Use `market.targetNetApy` only for the hypothetical target scenario.
4. State that projected APY is variable and not realized performance.
5. Do not apply funding carry when current hedge notional is zero.

### Verify an agent decision

1. Fetch `GET /api/agent/status`.
2. Inspect the latest decision, safety checks, errors, and transaction hash.
3. Open the transaction on Mantlescan.
4. Query Ponder decisions when independent indexed evidence is required.

## Constraints

- Treat MolQ as experimental and unaudited.
- Do not guarantee yield, principal protection, liquidity, or profitability.
- Do not expose or request operator keys, exchange secrets, or signing keys.
- Public GET endpoints are safe to inspect.
- Operator POST endpoints are privileged and must not be called without explicit
  authorization and an operator-owned credential.
- Bybit is offchain custody and is not proven by the vault contract.
- External USDe acquisition routes are third-party applications.
