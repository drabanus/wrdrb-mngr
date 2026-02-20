#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# Garderobe – Choir Wardrobe Manager  ·  Install & Deploy Script
# ─────────────────────────────────────────────────────────────
# Usage:
#   chmod +x install.sh
#   ./install.sh                        # interactive – asks for settings
#   ./install.sh --defaults             # non-interactive – uses defaults
#   sudo ./install.sh --service --nginx # full production setup
#
# Requirements: curl, git, Node.js >= 18 (installed automatically
#               via fnm if not found)
# ─────────────────────────────────────────────────────────────

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_MIN=18
SERVICE_NAME="garderobe"
DEFAULT_PORT=3000
DEFAULT_ORIGIN="http://localhost:3000"

# ── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERR]${NC}   $*"; exit 1; }

# ── Parse args ──────────────────────────────────────────────
USE_DEFAULTS=false
INSTALL_SERVICE=false
INSTALL_NGINX=false
DOMAIN=""
for arg in "$@"; do
  case "$arg" in
    --defaults) USE_DEFAULTS=true ;;
    --service)  INSTALL_SERVICE=true ;;
    --nginx)    INSTALL_NGINX=true ;;
    --domain=*) DOMAIN="${arg#*=}" ;;
    --help|-h)
      echo "Usage: $0 [--defaults] [--service] [--nginx] [--domain=example.com]"
      echo "  --defaults          Skip prompts, use default settings"
      echo "  --service           Install a systemd service"
      echo "  --nginx             Set up nginx reverse proxy + HTTPS"
      echo "  --domain=DOMAIN     Domain name for nginx/SSL (e.g. garderobe.example.com)"
      exit 0 ;;
  esac
done

# ── 1. Check / install Node.js ──────────────────────────────
install_node_fnm() {
  info "Installing fnm (Fast Node Manager)..."
  curl -fsSL https://fnm.vercel.app/install | bash
  export PATH="$HOME/.local/share/fnm:$PATH"
  eval "$(fnm env)"
  fnm install 22
  fnm use 22
  ok "Node.js $(node -v) installed via fnm"
}

check_node() {
  if command -v node &>/dev/null; then
    NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VER" -ge "$NODE_MIN" ]; then
      ok "Node.js $(node -v) detected"
      return 0
    else
      warn "Node.js $(node -v) is too old (need >= $NODE_MIN)"
    fi
  else
    warn "Node.js not found"
  fi

  if [ "$USE_DEFAULTS" = true ]; then
    install_node_fnm
  else
    echo ""
    read -rp "Install Node.js 22 via fnm? [Y/n] " yn
    case "${yn:-Y}" in
      [Yy]*|"") install_node_fnm ;;
      *) err "Node.js >= $NODE_MIN is required. Install it and re-run." ;;
    esac
  fi
}

check_node

# ── 2. Gather settings ──────────────────────────────────────
if [ "$USE_DEFAULTS" = true ]; then
  PORT=$DEFAULT_PORT
  ORIGIN=$DEFAULT_ORIGIN
else
  echo ""
  info "Configuration (press Enter for defaults)"
  read -rp "  Port [$DEFAULT_PORT]: " PORT
  PORT=${PORT:-$DEFAULT_PORT}
  DEFAULT_ORIGIN="http://localhost:$PORT"
  read -rp "  Origin URL [$DEFAULT_ORIGIN]: " ORIGIN
  ORIGIN=${ORIGIN:-$DEFAULT_ORIGIN}
fi

echo ""
info "Settings:"
info "  Port:   $PORT"
info "  Origin: $ORIGIN"
info "  App:    $APP_DIR"
echo ""

# ── 3. Install dependencies ─────────────────────────────────
info "Installing npm dependencies..."
cd "$APP_DIR"
npm ci --omit=dev 2>/dev/null || npm install --omit=dev
ok "Dependencies installed"

# ── 4. Generate Prisma client ───────────────────────────────
info "Generating Prisma client..."
npx prisma generate
ok "Prisma client generated"

# ── 5. Set up database ──────────────────────────────────────
info "Applying database schema..."
npx prisma db push --skip-generate
ok "Database ready at prisma/garderobe.db"

# ── 6. Build the application ────────────────────────────────
info "Building SvelteKit application..."
npm run build
ok "Build complete → build/"

# ── 7. Create .env file ─────────────────────────────────────
ENV_FILE="$APP_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  info "Creating .env file..."
  cat > "$ENV_FILE" <<EOF
# Garderobe – Runtime Configuration
# Adjust these values for your server

PORT=$PORT
ORIGIN=$ORIGIN
NODE_ENV=production

# SMTP settings (configure in the app's Admin panel, or set here)
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
# SMTP_FROM=
EOF
  ok ".env created"
else
  warn ".env already exists – skipping (check PORT=$PORT and ORIGIN=$ORIGIN)"
fi

# ── 8. Ensure start script is executable ──────────────────────
START_SCRIPT="$APP_DIR/start.sh"
if [ -f "$START_SCRIPT" ]; then
  chmod +x "$START_SCRIPT"
  ok "start.sh already present"
else
  err "start.sh missing – it should be part of the repository"
fi

# ── 9. (Optional) Install systemd service ───────────────────
install_systemd() {
  if [ "$(id -u)" -ne 0 ]; then
    warn "systemd service install requires root. Re-run with: sudo $0 --service"
    return
  fi

  SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
  info "Installing systemd service → $SERVICE_FILE"

  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Garderobe – Choir Wardrobe Manager
After=network.target

[Service]
Type=simple
User=$(logname 2>/dev/null || echo "$SUDO_USER")
WorkingDirectory=$APP_DIR
ExecStart=$APP_DIR/start.sh
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=ORIGIN=$ORIGIN

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable "$SERVICE_NAME"
  systemctl start "$SERVICE_NAME"
  ok "Service '$SERVICE_NAME' installed and started"
  info "Manage with: systemctl {start|stop|restart|status} $SERVICE_NAME"
  info "View logs:   journalctl -u $SERVICE_NAME -f"
}

if [ "$INSTALL_SERVICE" = true ]; then
  install_systemd
else
  if [ "$USE_DEFAULTS" = false ]; then
    echo ""
    read -rp "Install as systemd service? [y/N] " yn
    case "${yn:-N}" in
      [Yy]*) install_systemd ;;
    esac
  fi
fi

# ── 10. (Optional) Nginx reverse proxy + HTTPS ──────────────
install_nginx() {
  if [ "$(id -u)" -ne 0 ]; then
    warn "nginx setup requires root. Re-run with: sudo $0 --nginx --domain=your.domain.com"
    return
  fi

  # Get domain
  if [ -z "$DOMAIN" ]; then
    if [ "$USE_DEFAULTS" = true ]; then
      err "--nginx requires --domain=your.domain.com"
    fi
    read -rp "  Domain or IP (e.g. garderobe.example.com or 85.214.182.142): " DOMAIN
    [ -z "$DOMAIN" ] && err "Domain or IP is required for nginx setup"
  fi

  # Install nginx if missing
  if ! command -v nginx &>/dev/null; then
    info "Installing nginx..."
    apt-get update -qq && apt-get install -y -qq nginx
    ok "nginx installed"
  fi

  # Install certbot if missing
  if ! command -v certbot &>/dev/null; then
    info "Installing certbot for Let's Encrypt..."
    apt-get install -y -qq certbot python3-certbot-nginx
    ok "certbot installed"
  fi

  # Write nginx config (HTTP-only first; certbot adds HTTPS after obtaining cert)
  NGINX_CONF="/etc/nginx/sites-available/${SERVICE_NAME}"
  info "Writing nginx config → $NGINX_CONF"

  cat > "$NGINX_CONF" <<EOF
# Garderobe – Nginx reverse proxy
# Generated by install.sh – certbot will add HTTPS automatically

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy to SvelteKit (base path /garderobe is handled by the app)
    location /garderobe {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts for long-running requests
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Redirect bare domain to /garderobe
    location = / {
        return 302 /garderobe;
    }
}
EOF

  # Enable the site
  ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

  # Test config
  nginx -t || err "nginx config test failed – check $NGINX_CONF"
  systemctl reload nginx
  ok "nginx configured for ${DOMAIN}"

  # Obtain SSL certificate (only for domain names, not bare IPs)
  echo ""
  # Check if DOMAIN looks like an IP address
  if echo "$DOMAIN" | grep -qP '^\d{1,3}(\.\d{1,3}){3}$'; then
    warn "Let's Encrypt cannot issue certificates for bare IP addresses."
    info "The app is available via HTTP at: http://${DOMAIN}/garderobe"
    info "To add HTTPS later, point a domain to this IP and run:"
    info "  sudo certbot --nginx -d your.domain.com"
    REAL_ORIGIN="http://${DOMAIN}"
  else
    info "Requesting Let's Encrypt certificate for ${DOMAIN}..."
    info "(Make sure DNS for ${DOMAIN} points to this server first)"

    if [ "$USE_DEFAULTS" = true ]; then
      certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email || {
        warn "certbot failed – you can retry later with:"
        warn "  sudo certbot --nginx -d $DOMAIN"
      }
    else
      read -rp "  Request SSL certificate now? (DNS must point here) [Y/n] " yn
      case "${yn:-Y}" in
        [Yy]*|"")
          read -rp "  Email for Let's Encrypt (optional, press Enter to skip): " LE_EMAIL
          if [ -n "$LE_EMAIL" ]; then
            certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$LE_EMAIL"
          else
            certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email
          fi
          ;;
        *)
          info "Skipped. Run later: sudo certbot --nginx -d $DOMAIN"
          ;;
      esac
    fi
    REAL_ORIGIN="https://${DOMAIN}"
  fi
  if [ -f "$APP_DIR/.env" ]; then
    sed -i "s|^ORIGIN=.*|ORIGIN=${REAL_ORIGIN}|" "$APP_DIR/.env"
    ok "Updated ORIGIN=${REAL_ORIGIN} in .env"
  fi

  # Restart the app service if running
  if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    systemctl restart "$SERVICE_NAME"
    ok "Restarted $SERVICE_NAME service with new ORIGIN"
  fi

  echo ""
  ok "nginx + HTTPS setup complete"
  info "Your app is at: https://${DOMAIN}/garderobe"
  info "SSL auto-renews via: systemctl list-timers certbot.timer"
}

if [ "$INSTALL_NGINX" = true ]; then
  install_nginx
else
  if [ "$USE_DEFAULTS" = false ]; then
    echo ""
    read -rp "Set up nginx reverse proxy + HTTPS? [y/N] " yn
    case "${yn:-N}" in
      [Yy]*) install_nginx ;;
    esac
  fi
fi

# ── Done ─────────────────────────────────────────────────────
FINAL_URL="${ORIGIN}/garderobe"
[ -n "$DOMAIN" ] && FINAL_URL="https://${DOMAIN}/garderobe"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Garderobe is ready!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Start manually:  ./start.sh"
echo "  Access the app:  ${FINAL_URL}"
echo ""
echo "  Useful commands:"
echo "    npm run db:seed     – Seed the database with sample data"
echo "    npx prisma studio   – Browse the database"
echo ""
if [ -n "$DOMAIN" ]; then
echo "  HTTPS:"
echo "    Cert auto-renews via certbot.timer"
echo "    Force renewal: sudo certbot renew"
echo "    nginx config:  /etc/nginx/sites-available/${SERVICE_NAME}"
echo ""
fi
