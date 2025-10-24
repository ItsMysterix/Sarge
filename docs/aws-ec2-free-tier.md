# AWS EC2 Free Tier Deploys (via SSM)

This guide walks you through deploying Sarge to a free-tier EC2 instance using Docker Compose and AWS Systems Manager (SSM).

## Prerequisites

- AWS Account with IAM user or role that can use SSM and access the EC2 instance
- GitHub repository secrets for AWS and SSM (see below)
- A GitHub PAT with `read:packages` stored in AWS SSM Parameter Store (SecureString)

## EC2 Instance

1. Launch an EC2 instance:
   - Type: t2.micro (Free Tier)
   - AMI: Amazon Linux 2023
   - IAM Role: attach `AmazonSSMManagedInstanceCore`
   - Security Group: allow 80/443 (or 3000/3001 for dev/testing). SSH optional.
2. User data (optional): run bootstrap script
   - Copy our script to a public location or use repo raw URL, then:

```bash
#!/bin/bash
curl -fsSL https://raw.githubusercontent.com/<owner>/<repo>/main/ops/ec2-bootstrap.sh | bash
```

3. Verify SSM connectivity:

```bash
aws ssm describe-instance-information --region <your-region>
```

## Parameter Store (GHCR PAT)

Create a SecureString parameter that stores a GitHub Personal Access Token with `read:packages`:

- Name: `/sarge/ghcr_pat` (or your choice)
- Type: SecureString
- Value: <your-PAT>

You will reference this parameter by name in the release workflow.

## Compose & Env

- The release workflow deploy script renders `compose.prod.yaml` into `/opt/sarge/deploy/compose.yaml` replacing placeholders.
- Create env files on the instance:
  - `/opt/sarge/env/backend.env`
  - `/opt/sarge/env/app.env`

Suggested vars:

- Shared:
  - `DATABASE_URL=postgres://...`
  - `ALLOWED_ORIGINS=https://your-app.example`
  - `WS_ALLOWED_ORIGINS=https://your-app.example`
  - `PROM_METRICS_TOKEN=...` (required in prod)
  - `RATE_LIMIT_WINDOW_SEC=60`, `RATE_LIMIT_MAX=120`, `RATE_LIMIT_BURST=60`, `RATE_LIMIT_SCOPE=ip`
  - `MAX_WS_SUBSCRIPTIONS_PER_CONN=16`, `MAX_WS_MSGS_PER_MIN=240`, `MAX_JSON_BODY_KB=512`
  - `METRICS_PORT=3000` (so healthcheck `/metrics` is on 3000 in the container)
- App:
  - `PORT=3001`
  - `NEXT_PUBLIC_*` as needed

## Release Workflow Inputs & Secrets

- Secrets (GitHub):
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `EC2_SSM_TARGET` – either the Instance ID (e.g., `i-0abc...`) or a tag Name value used by the workflow
  - `GHCR_PAT_PARAM` – name of your SSM parameter (e.g., `/sarge/ghcr_pat`)
- Vars (optional):
  - `AWS_REGION` – defaults to `us-east-1` if not set

Trigger a deploy:

- From the Actions tab, run "Release" workflow (workflow_dispatch) with:
  - environment: dev (default)
  - deploy: true

## Preflight validation (recommended)

Before any production deploy, run the Preflight workflow from the Actions tab (workflow_dispatch). It:

- Builds both containers in CI without pushing
- Validates compose/nginx configs and the migrate script (dry-run)
- Checks that required secrets/vars are wired and visible to the workflow

A green Preflight result means the “Release” workflow is safe to run. If it fails, the summary output lists the exact items to fix.

## Rollback

Redeploy a previous SHA by manually running the release workflow and setting the SHA via a custom override (or use the last successful run’s SHA). On the instance, you can manually roll back:

```bash
# On EC2 via SSM: replace SHA with previous
export REPO="<owner>/<repo>"
export SHA="<previous-sha>"
export GHCR_USER="<your-gh-username>"
export GHCR_PAT_PARAM="/sarge/ghcr_pat"
/ bin/bash /opt/sarge/ssm-deploy.sh
```

Or with Compose directly (not recommended if using the scripted deploy):

```bash
cd /opt/sarge/deploy
sed -i "s/${CURRENT_SHA}/${PREV_SHA}/g" compose.yaml
docker compose up -d
```
