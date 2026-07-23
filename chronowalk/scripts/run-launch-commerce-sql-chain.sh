#!/usr/bin/env bash
# Apply the full launch-commerce SQL chain against a disposable local Postgres DB.
# Never points at a remote Supabase project.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${CW_MIG_PGHOST:-127.0.0.1}"
PORT="${CW_MIG_PGPORT:-5432}"
USER="${CW_MIG_PGUSER:-postgres}"
DB="${1:-cw_launch_chain}"
PASS_LABEL="${2:-run}"

psql_cmd() {
  PGPASSWORD="${CW_MIG_PGPASSWORD:-${PGPASSWORD:-}}" psql -h "$HOST" -p "$PORT" -U "$USER" "$@"
}

echo "==> [$PASS_LABEL] recreate disposable db $DB"
psql_cmd -d postgres -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB' AND pid <> pg_backend_pid();" >/dev/null || true
psql_cmd -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $DB;"
psql_cmd -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $DB;"
psql_cmd -d "$DB" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;

-- Hosted Supabase model: pgcrypto lives in `extensions`, not on default search_path.
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pgcrypto;
CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
SELECT set_config('search_path', 'public, pg_catalog', false);
SQL

apply() {
  local file="$1"
  echo "==> [$PASS_LABEL] apply $file"
  psql_cmd -d "$DB" -v ON_ERROR_STOP=1 -f "$ROOT/$file"
}

apply scripts/paddle-customers-migration.sql
apply supabase/migrations/20260721_launch_commerce_hardening.sql
apply supabase/migrations/20260721_launch_commerce_hardening_verify.sql
apply supabase/migrations/20260721_paddle_price_fulfillment.sql
apply supabase/migrations/20260722_fulfillment_outbox_worker.sql
apply supabase/migrations/20260722_fulfillment_outbox_worker_verify.sql
apply supabase/migrations/20260722_paddle_adjustments.sql
apply supabase/migrations/20260722_paddle_adjustments_verify.sql
apply supabase/migrations/20260724_bundle_invite_canonical.sql
apply supabase/migrations/20260724_bundle_invite_canonical_verify.sql
apply supabase/migrations/20260725_walk_session_discovery.sql
apply supabase/migrations/20260725_walk_session_discovery_verify.sql
apply supabase/migrations/20260726_walk_session_participant.sql
apply supabase/migrations/20260726_walk_session_participant_verify.sql
apply supabase/migrations/20260727_webhook_failed_reclaim.sql
apply supabase/migrations/20260727_webhook_failed_reclaim_verify.sql

# Confirm synthetic verify rows did not survive rollbacks
REMAINING="$(psql_cmd -d "$DB" -At -c "select count(*) from public.purchases where email like '%@example.invalid';")"
echo "==> [$PASS_LABEL] remaining example.invalid purchases: $REMAINING"
if [[ "$REMAINING" != "0" ]]; then
  echo "synthetic rows leaked after verify rollback" >&2
  exit 1
fi

echo "==> [$PASS_LABEL] FULL SQL CHAIN OK"
