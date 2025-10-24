# Rate Limit Runbook

If `RateLimitDenialsHigh` fires:

1) Verify context
- Confirm recent traffic spikes or abusive patterns.
- Use logs to identify source IPs and routes (look for `rate-limit deny` entries).

2) Immediate actions
- If a single IP: block at Nginx or security group.
- If legitimate traffic: temporarily increase RATE_LIMIT_* env vars and redeploy.

3) Tune safely
- Adjust `RATE_LIMIT_WINDOW_SEC`, `RATE_LIMIT_MAX`, and `RATE_LIMIT_BURST` carefully.
- Monitor Prometheus panels for denials dropping to expected levels.

4) Follow-up
- Add bot rules at Nginx.
- Coordinate with clients to smooth burst patterns.
