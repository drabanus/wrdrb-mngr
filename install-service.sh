#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# Garderobe – Install & enable systemd service
# ─────────────────────────────────────────────────────────────
# This creates a persistent Linux service so the app keeps
# running after you log out and restarts on boot / crash.
#
# Usage:
#   sudo ./install-service.sh            # install and start
#   sudo ./install-service.sh --remove   # stop and remove
# ─────────────────────────────────────────────────────────────

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVICE_NAME="garderobe"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

# ── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[ OK ]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERR]${NC}   $*"; exit 1; }

# ── Root check ──────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
  err "This script must be run as root.  Try:  sudo $0"
fi

# ── Remove mode ─────────────────────────────────────────────
if [ "${1:-}" = "--remove" ]; then
  info "Stopping and removing ${SERVICE_NAME} service..."
  systemctl stop "$SERVICE_NAME" 2>/dev/null || true
  systemctl disable "$SERVICE_NAME" 2>/dev/null || true
  rm -f "$SERVICE_FILE"
  systemctl daemon-reload
  ok "Service '${SERVICE_NAME}' removed."
  exit 0
fi

# ── Verify start.sh exists ──────────────────────────────────
if [ ! -x "$APP_DIR/start.sh" ]; then
  err "start.sh not found or not executable in $APP_DIR\n       Run install.sh first to build the app."
fi

# ── Determine the service user ──────────────────────────────
# Prefer SUDO_USER (the user who invoked sudo); fall back to owner of APP_DIR
SERVICE_USER="${SUDO_USER:-$(stat -c '%U' "$APP_DIR")}"
info "Service will run as user: ${SERVICE_USER}"

# ── Read port & origin from .env (if present) ───────────────
PORT=3000
ORIGIN="http://localhost:3000"
if [ -f "$APP_DIR/.env" ]; then
  # Source .env values safely
  PORT=$(grep -oP '^PORT=\K.*' "$APP_DIR/.env" 2>/dev/null || echo "3000")
  ORIGIN=$(grep -oP '^ORIGIN=\K.*' "$APP_DIR/.env" 2>/dev/null || echo "http://localhost:3000")
fi

# ── Create the systemd unit ─────────────────────────────────
info "Creating systemd service → ${SERVICE_FILE}"

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Garderobe – Choir Wardrobe Manager
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${APP_DIR}
ExecStart=${APP_DIR}/start.sh
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=${PORT}
Environment=ORIGIN=${ORIGIN}

# Hardening
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=${APP_DIR}

[Install]
WantedBy=multi-user.target
EOF

# ── Enable & start ──────────────────────────────────────────
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"

# Stop old instance if running (e.g. from start.sh in a terminal)
systemctl restart "$SERVICE_NAME"

ok "Service '${SERVICE_NAME}' installed and started."
echo ""
info "The app stays running after logout and starts automatically on boot."
echo ""
echo "  Useful commands:"
echo "    systemctl status  ${SERVICE_NAME}     – check if running"
echo "    systemctl restart ${SERVICE_NAME}     – restart the app"
echo "    systemctl stop    ${SERVICE_NAME}     – stop the app"
echo "    journalctl -u ${SERVICE_NAME} -f      – follow live logs"
echo ""
