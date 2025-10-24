# Logs Runbook

## Where to look

- CloudWatch:
  - Group: `/sarge/backend` – app logs from backend container
  - Group: `/sarge/app` – app logs from Next.js container
- Nginx:
  - `/var/log/nginx/access.log`
  - `/var/log/nginx/error.log`
- Docker container JSON logs (rotated):
  - `/var/lib/docker/containers/*/*-json.log`

## Useful commands

```
# Tail Nginx access logs
sudo tail -f /var/log/nginx/access.log

# CloudWatch tail (requires AWS CLI v2)
aws logs tail /sarge/backend --follow --since 1h --region $AWS_REGION

# Grep JSON logs for errors
sudo find /var/lib/docker/containers -name "*json.log" -exec grep -H "error" {} \;
```
