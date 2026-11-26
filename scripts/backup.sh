#!/usr/bin/env bash
# Back up the PostGIS database and uploaded photos, keeping the last N days.
#
# Usage (from the project folder on the server):
#   ./scripts/backup.sh
# Cron, every night at 02:30:
#   30 2 * * * cd /opt/peta-perlengkapan-jalan && ./scripts/backup.sh >> /var/log/peta-backup.log 2>&1
#
# Settings (environment variables):
#   BACKUP_DIR      where backups go       (default: /var/backups/peta-perlengkapan-jalan)
#   RETENTION_DAYS  how many days to keep  (default: 14)

set -euo pipefail

cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-/var/backups/peta-perlengkapan-jalan}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"

# Read database name and user from .env without executing it.
env_value() { grep -E "^$1=" .env | tail -n1 | cut -d= -f2- | tr -d '"' || true; }
POSTGRES_DB="$(env_value POSTGRES_DB)"; POSTGRES_DB="${POSTGRES_DB:-gis}"
POSTGRES_USER="$(env_value POSTGRES_USER)"; POSTGRES_USER="${POSTGRES_USER:-gis}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

echo "[$(date -Is)] Backing up database $POSTGRES_DB"
docker compose exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom \
  > "$BACKUP_DIR/db-$STAMP.dump.partial"
mv "$BACKUP_DIR/db-$STAMP.dump.partial" "$BACKUP_DIR/db-$STAMP.dump"

echo "[$(date -Is)] Backing up uploaded photos"
docker compose exec -T app tar -C /app/storage -czf - uploads \
  > "$BACKUP_DIR/uploads-$STAMP.tar.gz.partial"
mv "$BACKUP_DIR/uploads-$STAMP.tar.gz.partial" "$BACKUP_DIR/uploads-$STAMP.tar.gz"

echo "[$(date -Is)] Removing backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'db-*.dump' -o -name 'uploads-*.tar.gz' -o -name '*.partial' \) \
  -mtime +"$RETENTION_DAYS" -delete

echo "[$(date -Is)] Done: $(du -sh "$BACKUP_DIR" | cut -f1) in $BACKUP_DIR"
