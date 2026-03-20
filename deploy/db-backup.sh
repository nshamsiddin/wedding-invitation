#!/usr/bin/env bash
# ─── SQLite hot-backup script ─────────────────────────────────────────────────
#
# Creates a consistent point-in-time snapshot of the SQLite database using
# sqlite3's built-in .backup command, which honours WAL mode and produces a
# valid DB file even while the server is running and writing.
#
# Usage (manual):
#   bash db-backup.sh
#
# Usage (automated — add to /etc/cron.d/invitation or via crontab -e):
#   0 3 * * * root /opt/invitation/deploy/db-backup.sh >> /var/log/invitation/backup.log 2>&1
#
# Environment variables (can be set in .env or the calling shell):
#   DATABASE_PATH   — absolute path to the live DB file  (default: /opt/invitation/guests.db)
#   BACKUP_DIR      — directory to write snapshots into    (default: /var/backups/invitation)
#   BACKUP_KEEP     — number of daily snapshots to retain  (default: 30)
#
# Recovery procedure:
#   1. Stop the server:            pm2 stop invitation
#   2. Copy snapshot into place:   cp /var/backups/invitation/guests-YYYY-MM-DD.db /opt/invitation/guests.db
#   3. Restart:                    pm2 start invitation
#   4. Verify:                     curl https://your-domain/api/health
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

DB_PATH="${DATABASE_PATH:-/opt/invitation/guests.db}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/invitation}"
KEEP="${BACKUP_KEEP:-30}"
TIMESTAMP="$(date +%Y-%m-%d)"
DEST="${BACKUP_DIR}/guests-${TIMESTAMP}.db"

if [[ ! -f "${DB_PATH}" ]]; then
  echo "[backup] ERROR: database file not found at ${DB_PATH}" >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

# sqlite3 .backup is an online, WAL-safe hot backup — safe to run while the
# server is live.  It will not produce a torn or partial file.
sqlite3 "${DB_PATH}" ".backup '${DEST}'"

SIZE="$(du -sh "${DEST}" | cut -f1)"
echo "[backup] ${TIMESTAMP} — snapshot written to ${DEST} (${SIZE})"

# Prune backups older than KEEP days
find "${BACKUP_DIR}" -name 'guests-*.db' -mtime "+${KEEP}" -print -delete \
  | while read -r f; do echo "[backup] pruned old snapshot: ${f}"; done

echo "[backup] done"
