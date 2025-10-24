# Production Stack (EC2 + Nginx + TLS)

Client → Nginx(443) → App(3001) / Backend(3000)

- Nginx terminates TLS via acme.sh certificates in `/opt/sarge/tls`.
- Routes:
  - `/` and `/api/` → App container (Next.js) on port 3001
  - `/ws` and `/metrics` → Backend container on port 3000
- WebSocket upgrade is enabled on `/ws`.
- HSTS enabled by default (adjust header in nginx.conf).

## DNS & TLS

- Create an A record pointing your domain to the EC2 public IP.
- Open security group ports 80/443.
- Set `DOMAIN` and `EMAIL` in `/opt/sarge/env/tls.env` (or `backend.env`).
- First deploy runs `ops/tls/acme-bootstrap.sh` if certs missing.
- Monthly cron renew runs and reloads nginx.

## Logs

- Containers use `awslogs` driver:
  - `/sarge/backend`
  - `/sarge/app`
- Nginx access/error logs rotate via logrotate.

## Resource Caps & Healthchecks

- Each service has CPU and memory limits and a healthcheck.
- Nginx waits until app+backend are healthy.

## Rollout / Rollback

- Deploy via Release workflow (SSM) – see `docs/aws-ec2-free-tier.md`.
- Rollback by rerunning deploy with a previous SHA or editing compose and `docker compose up -d`.
