# MolQ

MolQ is an autonomous CeDeFi yield agent on Mantle. Users deposit USDe into a
verified ERC-4626 vault. The vault supplies an 85% Shield sleeve to Aave V3 and
keeps 15% liquid for a policy-capped Bybit hedge. OpenAI proposes each strategy
action, deterministic controls constrain it, and the final decision is committed
on-chain.

## Track

Primary track: **AI Trading & Strategy**

MolQ is not a rebalancing dashboard. It is an agent that evaluates live Aave and
Bybit markets, makes an autonomous capital decision, executes through guarded
adapters, and creates verifiable decision evidence.

## Differentiators

- ERC-8004 identity `112` on Mantle.
- Real OpenAI policy proposals with deterministic capital constraints.
- Verified Mantle contracts and real Aave V3 USDe integration.
- Authenticated Bybit execution adapter with leverage, slippage, notional, and
  idempotency controls.
- Ponder indexer for identity, vault, profit, and decision events.
- Sustainable 10% performance fee charged only on realized profit.

## Mainnet Evidence

| Component            | Mantle mainnet                                                       |
| -------------------- | -------------------------------------------------------------------- |
| Vault                | `0xBcBe5DE4D9F8F9336924eCB90888a775DfB06Eb9`                         |
| Decision logger      | `0x24df9c33D24D7C84e527D247D25a203490001Be9`                         |
| ERC-8004 registry    | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`                         |
| Agent ID             | `112`                                                                |
| Live OpenAI decision | `0xb2604ab8b1ffbf04943dda52649b98513c240e8ecaf86e03ba25697083e8e6fb` |

## Current Readiness

- Contracts, API, web, and indexer build successfully.
- Foundry tests include a real Mantle/Aave fork.
- OpenAI access is live and has produced an on-chain decision.
- Bybit credentials are locally configured, but trading remains deliberately
  disabled until venue connectivity and account funding are verified.
- Owner, keeper, and treasury currently use the demo operator wallet. Production
  launch requires a fresh multisig and rotated API credentials.

## Submission Checklist

- Publish repository and add its URL to DoraHacks.
- Deploy web, API, and Ponder services to public HTTPS URLs.
- Record the demo using `docs/DEMO_SCRIPT.md`.
- Add public demo/video links to this file and the ERC-8004 registration profile.
- Rotate all credentials that were shared through chat before public operation.
