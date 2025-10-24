#!/usr/bin/env bash
set -euo pipefail

# Install Docker
if ! command -v docker >/dev/null 2>&1; then
  sudo yum update -y
  sudo amazon-linux-extras enable docker || true
  sudo yum install -y docker
  sudo systemctl enable docker
  sudo systemctl start docker
  sudo usermod -aG docker ec2-user || true
fi

# Install Docker Compose v2
if ! docker compose version >/dev/null 2>&1; then
  sudo curl -SL https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  # symlink for docker compose
  sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
fi

# Tools
sudo yum install -y jq gettext socat cronie logrotate

# Create directories
sudo mkdir -p /opt/sarge/env /opt/sarge/deploy /opt/sarge/tls /opt/sarge/logrotate.d
sudo chown -R ec2-user:ec2-user /opt/sarge

# Ensure SSM Agent is running
sudo systemctl enable amazon-ssm-agent || true
sudo systemctl start amazon-ssm-agent || true

# Enable cron for acme renew
sudo systemctl enable crond || true
sudo systemctl start crond || true

# Create CloudWatch log groups (ignore if exist)
if command -v aws >/dev/null 2>&1; then
  aws logs create-log-group --log-group-name /sarge/backend --region ${AWS_REGION:-us-east-1} || true
  aws logs create-log-group --log-group-name /sarge/app --region ${AWS_REGION:-us-east-1} || true
fi

# Logrotate rules
sudo tee /etc/logrotate.d/sarge-nginx <<'ROT'
/var/log/nginx/*.log {
  daily
  missingok
  rotate 7
  compress
  delaycompress
  notifempty
  create 0640 nginx adm
  sharedscripts
  postrotate
    [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
  endscript
}
ROT

sudo tee /etc/logrotate.d/docker-containers <<'ROT'
/var/lib/docker/containers/*/*-json.log {
  size 10M
  rotate 5
  compress
  missingok
  copytruncate
}
ROT

echo "Bootstrap complete. Reboot recommended to ensure docker group applies."
