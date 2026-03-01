#!/usr/bin/env bash
# SQLite backup script for the wedding invitation app.
#
# Creates a consistent snapshot of the database using SQLite's own backup
# mechanism (respects WAL mode), uploads it to Backblaze B2 via rclone,
# and prunes local copies older than 30 days.
#
# SETUP
# -----
# 1. Configure rclone with your B2 credentials:
#      rclone config
#    Create a remote named "b2" (type: b2) and note the bucket name.
#
# 2. Edit B2_REMOTE and B2_BUCKET below to match your rclone remote + bucket.
#
# 3. Make the script executable:
#      chmod +x /opt/invitation/deploy/backup.sh
#
# 4. Add to the deploy user's crontab (runs daily at 03:00 UTC):
#      crontab -e
#      0 3 * * * /opt/invitation/deploy/backup.sh >> /var/log/invitation/backup.log 2>&1
#
# 5. Verify by running once manually:
#      /opt/invitation/deploy/backup.sh
#    then confirm the file appears in B2:
#      rclone ls b2:YOUR_BUCKET/db-backups/

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
DB_PATH="/opt/invitation/data/guests.db"
BACKUP_DIR="/opt/invitation/backups"
B2_REMOTE="b2"                   # rclone remote name (must match rclone config)
B2_BUCKET="YOUR_BUCKET"          # Backblaze B2 bucket name
B2_PATH="db-backups"             # folder inside the bucket
RETENTION_DAYS=30                # local copies older than this are deleted

# ── Derived variables ─────────────────────────────────────────────────────────
TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
DEST="$BACKUP_DIR/guests-$TIMESTAMP.db"

# ── Preflight checks ──────────────────────────────────────────────────────────
if [[ ! -f "$DB_PATH" ]]; then
  echo "[backup] ERROR: Database not found at $DB_PATH" >&2
  exit 1
fi

command -v sqlite3 >/dev/null 2>&1 || { echo "[backup] ERROR: sqlite3 not installed" >&2; exit 1; }
command -v rclone  >/dev/null 2>&1 || { echo "[backup] ERROR: rclone not installed" >&2; exit 1; }

# ── Create backup ─────────────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# Force a full WAL checkpoint so the backup contains all committed transactions.
# This is safe while the app is running — it does not block reads or writes.
sqlite3 "$DB_PATH" "PRAGMA wal_checkpoint(FULL);" > /dev/null

# Use SQLite's .backup command for an atomic, consistent snapshot.
# Unlike a plain file copy, this works correctly even if writes happen
# concurrently during the backup.
sqlite3 "$DB_PATH" ".backup '$DEST'"

echo "[backup] $(date -u) — snapshot created: $DEST ($(du -sh "$DEST" | cut -f1))"

# ── Upload to Backblaze B2 ────────────────────────────────────────────────────
rclone copy "$DEST" "${B2_REMOTE}:${B2_BUCKET}/${B2_PATH}/" \
  --transfers=1 \
  --retries=3 \
  --log-level=INFO

echo "[backup] $(date -u) — uploaded to ${B2_REMOTE}:${B2_BUCKET}/${B2_PATH}/"

# ── Prune old local backups ───────────────────────────────────────────────────
# Keep the last RETENTION_DAYS days of local snapshots as a fast-recovery layer.
find "$BACKUP_DIR" -name "guests-*.db" -mtime "+${RETENTION_DAYS}" -delete
LOCAL_COUNT=$(find "$BACKUP_DIR" -name "guests-*.db" | wc -l | tr -d ' ')
echo "[backup] $(date -u) — local backups retained: $LOCAL_COUNT"

echo "[backup] $(date -u) — done"
