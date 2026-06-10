# Operations Runbook

## Health

- API liveness: `https://api.molq.site/api/health`
- Dependency health: `https://api.molq.site/api/health/deep`
- Indexer health: `https://indexer.molq.site/health`
- Performance history: `https://api.molq.site/api/history`

The `molq-monitor` PM2 process checks deep health every minute. Set
`MOLQ_ALERT_WEBHOOK_URL` in `apps/api/.env` to deliver state-change alerts to a
Discord- or Slack-compatible webhook.

## PM2 recovery

```sh
pm2 status
pm2 logs molq-api --lines 200
pm2 logs molq-indexer --lines 200
pm2 logs molq-monitor --lines 200
pm2 restart molq-api molq-indexer molq-monitor
```

All three processes use automatic restart with exponential backoff. The API
also handles `SIGTERM` and `SIGINT` with a bounded graceful shutdown.

## Ponder schema changes

Ponder binds a production schema to the indexer app identity. When contract
sources or start blocks change, rotate the `--schema` value in
`deploy/ecosystem.config.cjs` instead of dropping the active schema. This keeps
the previous dataset available for rollback while the new schema replays
deterministic onchain history.

## Degraded health response

1. Identify the failed check in `/api/health/deep`.
2. Confirm Mantle RPC and contract reads.
3. Confirm Ponder sync state and PostgreSQL availability.
4. Confirm keeper and decision-logger authorization.
5. Keep Bybit trading disabled during investigation.
6. Pause vault deposits through the Safe if contract or Aave safety is in doubt.

Withdrawals remain available while sufficient Aave liquidity exists.

## Profit hardening

Profit hardening is disabled unless `MOLQ_PROFIT_HARDENING_ENABLED=true`.

Before execution:

1. Confirm the keeper wallet received external realized profit as canonical
   Mantle USDe.
2. Confirm the amount is below `MOLQ_MAX_HARDEN_PROFIT_USD`.
3. Confirm the vault treasury is the MolQ Safe.
4. Record the source and settlement evidence.

The operator calls `/api/execution/vault/harden` with a unique idempotency key.
The keeper approves USDe when required, calls `hardenProfit`, and waits for a
successful receipt. The vault sends the performance fee to treasury and
allocates net profit according to the shield target.

## Key rotation

- Vault owner and treasury should remain the Safe.
- The keeper is an operational signer and can be replaced by the Safe.
- Agent authorization can be revoked by the decision logger owner.
- Rotate API and model credentials after suspected disclosure.
- Never store signing keys in GitHub Actions logs or repository files.
