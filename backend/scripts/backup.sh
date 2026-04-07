#!/bin/bash
# ============================================================
# Pesantren DB Backup Script
# Runs pg_dump, saves to /backup/, retains last 30 days.
# Requirements: 22.6
# ============================================================

set -euo pipefail

# ── Config from environment variables ────────────────────────
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-pesantren}"
BACKUP_DIR="${BACKUP_DIR:-/backup}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# ── Derived values ────────────────────────────────────────────
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/pesantren_${TIMESTAMP}.dump"
LOG_PREFIX="[BACKUP][$(date '+%Y-%m-%d %H:%M:%S')]"

# ── Ensure backup directory exists ───────────────────────────
mkdir -p "${BACKUP_DIR}"

echo "${LOG_PREFIX} Starting database backup..."
echo "${LOG_PREFIX} Target: ${BACKUP_FILE}"

# ── Run pg_dump ───────────────────────────────────────────────
export PGPASSWORD="${DB_PASSWORD}"

if pg_dump \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --username="${DB_USER}" \
  --format=custom \
  --compress=9 \
  --no-password \
  "${DB_NAME}" \
  --file="${BACKUP_FILE}"; then

  FILESIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
  echo "${LOG_PREFIX} SUCCESS: Backup saved to ${BACKUP_FILE} (${FILESIZE})"
else
  echo "${LOG_PREFIX} ERROR: pg_dump failed for database '${DB_NAME}'" >&2
  exit 1
fi

# ── Cleanup old backups (older than RETENTION_DAYS) ──────────
echo "${LOG_PREFIX} Cleaning up backups older than ${RETENTION_DAYS} days..."
DELETED=$(find "${BACKUP_DIR}" -name "pesantren_*.dump" -mtime "+${RETENTION_DAYS}" -print -delete | wc -l)
echo "${LOG_PREFIX} Deleted ${DELETED} old backup(s)."

echo "${LOG_PREFIX} Backup complete."
