# MolQ Hackathon Submission Kit

## Track

Primary track: **AI Trading & Strategy**

MolQ is an autonomous USDe strategy on Mantle. It supplies the shield sleeve to
Aave V3 and conditionally opens a policy-capped Bybit ETHUSDT short only when
funding carry and risk checks justify the exposure.

## One-Line Pitch

MolQ is a non-custodial USDe vault whose constrained AI agent preserves Aave
yield, rejects negative hedge carry, and records every accepted decision on
Mantle under an ERC-8004 identity.

## Problem

USDe holders must manually compare lending yield, perpetual funding, liquidity,
and execution risk. Static vaults cannot react when hedge carry becomes
negative, while unconstrained trading agents can expose principal to excessive
exchange or model risk.

## Solution

- ERC-4626 custody and permissionless redemption on Mantle.
- 85% shield target supplied to Aave V3 USDe.
- 15% liquid sleeve available for a bounded Bybit hedge.
- OpenAI model proposals constrained by deterministic policy.
- Hedge rejected when funding, risk, freshness, or notional checks fail.
- ERC-8004 agent identity and on-chain decision evidence.
- Ponder indexer and public GraphQL endpoint.

## Live Proof

- Landing: https://molq.site
- Dapp: https://app.molq.site
- API: https://api.molq.site/api/health
- Indexer: https://indexer.molq.site/graphql
- Repository: https://github.com/aliens101/molq
- Vault: https://mantlescan.xyz/address/0xBcBe5DE4D9F8F9336924eCB90888a775DfB06Eb9#code
- Decision logger: https://mantlescan.xyz/address/0x24df9c33D24D7C84e527D247D25a203490001Be9#code
- ERC-8004 agent 112: https://mantlescan.xyz/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=112

## Current Mainnet Evidence

- A real deposit is deployed on Mantle.
- The vault automatically supplies approximately 85% to Aave.
- The keeper is enabled and authorized.
- The model runs every five minutes.
- Negative Bybit short funding is rejected, leaving hedge exposure at zero.
- Every accepted decision is committed to the decision logger and indexed.

Use the live `Performance` and `Agent` pages during judging rather than quoting
hard-coded rates, because Aave yield and Bybit funding are variable.

## Business Model

MolQ charges no deposit or withdrawal fee. A 10% performance fee applies only
when external Alpha profit is realized and hardened into the vault. Principal,
unrealized PnL, and normal Aave principal flows are excluded.

Initial users:

- USDe holders seeking automated risk-aware yield.
- DAO and protocol treasuries holding idle stable assets.
- Mantle-native yield products needing auditable agent execution.

## Demo Script

1. Open the landing page and explain the active projected APY versus the target
   scenario.
2. Open the dapp and show the live mainnet TVL and 85/15 allocation.
3. Open `Performance` and show that negative funding is excluded because no
   hedge is active.
4. Open `Agent` and show the latest model reasoning and deterministic safety
   checks.
5. Open the decision transaction on Mantlescan.
6. Open the ERC-8004 identity.
7. Open `Execution` and show Aave capital plus zero Bybit notional.
8. Deposit a small amount or show the existing deposit transaction.
9. Redeem mqUSDe to demonstrate permissionless custody.

## Required Submission Checklist

- [ ] Select or obtain nomination for AI Trading & Strategy.
- [ ] Add the live demo URL.
- [ ] Add the open-source GitHub repository.
- [ ] Add Mantle contract addresses.
- [ ] Upload a concise project pitch.
- [ ] Upload a demo video showing real mainnet state.
- [ ] Publish an X thread with `#MantleAIHackathon`.
- [ ] Include the pitch, demo video, GitHub link, and Mantle contract address in
      the thread.
- [ ] Clearly disclose that MolQ is experimental and not independently audited.
- [ ] Verify all links in a logged-out browser before submission.

## Suggested X Thread Structure

1. Problem and one-line MolQ solution.
2. Live 0.2 USDe mainnet deposit and Aave allocation.
3. Screenshot of the Performance page rejecting negative funding carry.
4. Screenshot of model reasoning plus policy checks.
5. Mantlescan decision and ERC-8004 identity links.
6. Architecture diagram and business model.
7. Demo, GitHub, and contract links with `#MantleAIHackathon`.
