# Business Model

MolQ charges a **10% performance fee only on realized profit** returned from the
Alpha strategy.

## Example

1. Users supply 10,000 USDe.
2. The Alpha strategy realizes 500 USDe.
3. The keeper calls `hardenProfit(500e18)`.
4. Treasury receives 50 USDe.
5. Vault shareholders receive 450 USDe of additional vault assets.

There is no fee on deposits, withdrawals, unrealized P&L, or Aave principal. The
contract caps the performance fee at 20%.

## Why It Scales

- Revenue aligns with user profit rather than TVL churn.
- ERC-4626 provides standard integrations and composability.
- Agent identity and decision records support institutional audit requirements.
- Additional strategy adapters can share the same policy and accounting layer.

## Mainnet Requirements

- Increase the current Safe beyond its present single-owner threshold before
  supporting material public capital.
- Keep the operational keeper replaceable by the Safe and rotate it regularly.
- Add venue collateral reconciliation and withdrawal automation.
- Complete independent smart-contract and operational-security reviews.
- Define jurisdiction, custody, disclosures, and user eligibility before taking
  public deposits.
