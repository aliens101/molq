# Demo Script

Target length: 3 minutes.

## 1. User Product

Open the Dashboard and show live Aave APY, Bybit funding, vault allocation, and
the verified Mantle network context. Open Deposit and show the wallet-controlled
USDe deposit flow and `mqUSDe` shares.

## 2. Autonomous Agent

Open Agent and show:

- OpenAI policy connected.
- ERC-8004 Agent `112`.
- Authorized decision logger.
- Bybit execution state.
- 10% profit-only business model.

Trigger `POST /api/agent/run` using the private operator control. Explain that
the model proposes a decision, then deterministic controls cap or reject it.

## 3. Verifiable Proof

Open the latest decision transaction on Mantlescan. For the existing proof, use:

`0xb2604ab8b1ffbf04943dda52649b98513c240e8ecaf86e03ba25697083e8e6fb`

Open ERC-8004 Agent `112` and the verified vault/logger contracts.

## 4. Profit Flow

Show the `hardenProfit` tests or a funded demo transaction:

- Gross realized profit enters as USDe.
- 10% goes to treasury.
- 90% increases `mqUSDe` share value.
- Ponder indexes `ProfitHardened`.

## 5. Close

MolQ gives users a single USDe vault while an identifiable, constrained agent
searches for positive carry and creates an auditable decision trail on Mantle.
