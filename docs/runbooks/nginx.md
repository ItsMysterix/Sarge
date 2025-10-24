# Nginx Runbook

## Test config and reload

```
docker exec nginx nginx -t
docker exec nginx nginx -s reload
```

## Logs

- Access: `/var/log/nginx/access.log`
- Error: `/var/log/nginx/error.log`
- Rotated daily via logrotate.

## Certs (acme.sh)

- Certs at `/opt/sarge/tls/{fullchain.pem,privkey.pem}`
- Force renew & reload:
```
# On instance
~/.acme.sh/acme.sh --cron --home ~/.acme.sh
docker exec nginx nginx -s reload
```
