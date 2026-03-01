#!/usr/bin/env bash
# One-time server bootstrap script for the wedding invitation app.
#
# Run this ONCE as root on a fresh Hetzner CX22 (Ubuntu 24.04) after first login.
# Idempotent — safe to re-run if interrupted.
#
# PREREQUISITES
# -------------
# 1. Hetzner CX22 provisioned with Ubuntu 24.04, Nuremberg datacenter.
# 2. Your SSH public key added to the server during provisioning.
# 3. DNS A record already pointing to this server's IP (needed for Certbot).
#
# USAGE
# -----
#   ssh root@YOUR_SERVER_IP
#   curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/YOUR_REPO/main/deploy/setup.sh | bash
#   # or copy the file and run:
#   bash /path/to/setup.sh
#
# After this script completes, continue with the post-setup steps printed at
# the end.

set -euo pipefail

DOMAIN="${DOMAIN:-}"           # Override: DOMAIN=wedding.example.com bash setup.sh
APP_DIR="/opt/invitation"
DATA_DIR="$APP_DIR/data"
BACKUP_DIR="$APP_DIR/backups"
LOG_DIR="/var/log/invitation"
DEPLOY_USER="deploy"
NODE_VERSION="20"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[setup]${NC} $*"; }
warn() { echo -e "${YELLOW}[setup]${NC} $*"; }
err()  { echo -e "${RED}[setup]${NC} $*" >&2; }

[[ $EUID -ne 0 ]] && { err "This script must be run as root."; exit 1; }

# ── 1. System packages ────────────────────────────────────────────────────────
log "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget git unzip gnupg ca-certificates \
  nginx sqlite3 certbot python3-certbot-nginx \
  ufw fail2ban

# ── 2. Node.js via NodeSource ─────────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node -e 'process.stdout.write(process.version.split(".")[0].slice(1))')" != "$NODE_VERSION" ]]; then
  log "Installing Node.js $NODE_VERSION LTS..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
  apt-get install -y -qq nodejs
fi
log "Node $(node --version), npm $(npm --version)"

# ── 3. PM2 ────────────────────────────────────────────────────────────────────
log "Installing PM2..."
npm install -g pm2 --silent

# ── 4. rclone (for B2 backups) ────────────────────────────────────────────────
if ! command -v rclone &>/dev/null; then
  log "Installing rclone..."
  curl -fsSL https://rclone.org/install.sh | bash
fi
log "rclone $(rclone --version | head -1)"

# ── 5. deploy user ────────────────────────────────────────────────────────────
if ! id "$DEPLOY_USER" &>/dev/null; then
  log "Creating $DEPLOY_USER user..."
  useradd -m -s /bin/bash "$DEPLOY_USER"
fi

# Copy root's authorized_keys so the same SSH key works for deploy
if [[ -f /root/.ssh/authorized_keys ]]; then
  install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
  install -m 600 -o "$DEPLOY_USER" -g "$DEPLOY_USER" \
    /root/.ssh/authorized_keys "/home/$DEPLOY_USER/.ssh/authorized_keys"
fi

# ── 6. App directories ────────────────────────────────────────────────────────
log "Creating app directories..."
install -d -m 755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" \
  "$APP_DIR" "$DATA_DIR" "$BACKUP_DIR" "$LOG_DIR"

# ── 7. PM2 startup on reboot ─────────────────────────────────────────────────
log "Configuring PM2 startup for $DEPLOY_USER..."
env PATH="$PATH:/usr/bin" pm2 startup systemd \
  -u "$DEPLOY_USER" --hp "/home/$DEPLOY_USER" | tail -1 | bash || true
# The deploy user will call 'pm2 save' after first start

# ── 8. Firewall (UFW) ─────────────────────────────────────────────────────────
log "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
log "UFW status:"
ufw status verbose

# ── 9. Fail2ban (SSH brute-force protection) ──────────────────────────────────
log "Enabling fail2ban..."
systemctl enable --now fail2ban

# ── 10. Nginx ─────────────────────────────────────────────────────────────────
log "Configuring Nginx..."
rm -f /etc/nginx/sites-enabled/default
systemctl enable nginx

if [[ -n "$DOMAIN" ]]; then
  log "Copying Nginx config for $DOMAIN..."
  cp "$APP_DIR/deploy/nginx.conf" "/etc/nginx/sites-available/invitation"
  sed -i "s/YOUR_DOMAIN/$DOMAIN/g" /etc/nginx/sites-available/invitation
  ln -sf /etc/nginx/sites-available/invitation /etc/nginx/sites-enabled/invitation

  # Verify Nginx config is valid
  nginx -t

  # Obtain Let's Encrypt certificate
  log "Obtaining TLS certificate for $DOMAIN..."
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
    --email "admin@$DOMAIN" --redirect
  log "TLS certificate obtained. Certbot timer:"
  systemctl status certbot.timer --no-pager || true
else
  warn "DOMAIN not set — skipping Nginx site config and Certbot."
  warn "After running this script, configure Nginx manually:"
  warn "  cp $APP_DIR/deploy/nginx.conf /etc/nginx/sites-available/invitation"
  warn "  sed -i 's/YOUR_DOMAIN/your.domain.com/g' /etc/nginx/sites-available/invitation"
  warn "  ln -sf /etc/nginx/sites-available/invitation /etc/nginx/sites-enabled/"
  warn "  certbot --nginx -d your.domain.com"
fi

systemctl reload nginx || true

# ── 11. rclone B2 config reminder ────────────────────────────────────────────
warn "rclone is installed but not yet configured."
warn "Run as the deploy user to configure Backblaze B2:"
warn "  sudo -u $DEPLOY_USER rclone config"
warn "  Create a remote named 'b2' (type: b2) with your B2 Application Key."
warn "  Then update B2_BUCKET in $APP_DIR/deploy/backup.sh"

# ── 12. Cron for backups ──────────────────────────────────────────────────────
log "Scheduling daily backup cron for $DEPLOY_USER..."
CRON_LINE="0 3 * * * $APP_DIR/deploy/backup.sh >> $LOG_DIR/backup.log 2>&1"
# Add only if not already present
(crontab -u "$DEPLOY_USER" -l 2>/dev/null; echo "$CRON_LINE") \
  | sort -u | crontab -u "$DEPLOY_USER" -
log "Cron installed for $DEPLOY_USER:"
crontab -u "$DEPLOY_USER" -l

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Server setup complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Copy and fill the production .env on the server:"
echo "     cp $APP_DIR/.env.production.example $APP_DIR/.env"
echo "     chmod 600 $APP_DIR/.env"
echo "     nano $APP_DIR/.env   # fill all <FILL_IN> values"
echo ""
echo "2. Configure rclone for B2 backups (as deploy user):"
echo "     sudo -u $DEPLOY_USER rclone config"
echo "     # then update B2_BUCKET in $APP_DIR/deploy/backup.sh"
echo ""
echo "3. Add these secrets to your GitHub repository"
echo "   (Settings → Secrets and variables → Actions):"
echo "     SERVER_HOST  = $(curl -sf https://ifconfig.me || echo '<this server IP>')"
echo "     SERVER_SSH_KEY = <contents of the deploy user private key>"
echo ""
echo "4. Generate an SSH key pair for GitHub Actions deploy:"
echo "     ssh-keygen -t ed25519 -C 'github-actions-deploy' -f /tmp/deploy_key -N ''"
echo "     cat /tmp/deploy_key.pub >> /home/$DEPLOY_USER/.ssh/authorized_keys"
echo "     cat /tmp/deploy_key    # copy this → GitHub Secret SERVER_SSH_KEY"
echo "     rm /tmp/deploy_key /tmp/deploy_key.pub"
echo ""
echo "5. Push to main on GitHub to trigger the first deployment."
echo ""
echo "6. Verify the deployment:"
echo "     pm2 status"
echo "     curl https://$DOMAIN/api/health"
echo ""
