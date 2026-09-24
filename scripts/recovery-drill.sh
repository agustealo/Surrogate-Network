#!/usr/bin/env bash
set -euo pipefail

: "${DB_URL:?DB_URL must be exported by supabase status before the recovery drill runs}"

command -v supabase >/dev/null 2>&1 || { echo "supabase CLI is required" >&2; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "psql is required" >&2; exit 1; }

PROFILE_ID="7a56e48f-3d65-4f49-a15d-a2a24d94a001"
NEED_ID="7a56e48f-3d65-4f49-a15d-a2a24d94a002"
TMP_DIR="$(mktemp -d)"
BACKUP_FILE="$TMP_DIR/public-data.sql"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

psql "$DB_URL" --set ON_ERROR_STOP=1 <<SQL
INSERT INTO public.profiles (
  id,
  name,
  email,
  bio,
  boundaries,
  is_admin,
  is_suspended
) VALUES (
  '$PROFILE_ID',
  'Recovery Drill Member',
  'recovery-drill@example.invalid',
  'recovery sentinel',
  ARRAY['platonic'::public.boundary],
  false,
  false
);

INSERT INTO public.needs (
  id,
  user_id,
  user_name,
  title,
  description,
  category,
  boundaries,
  location_mode,
  status,
  tags
) VALUES (
  '$NEED_ID',
  '$PROFILE_ID',
  'Recovery Drill Member',
  'Recovery drill need',
  'Relational sentinel used only by the CI recovery drill.',
  'personal'::public.surrogate_category,
  ARRAY['platonic'::public.boundary],
  'remote'::public.location_mode,
  'active'::public.need_status,
  ARRAY['recovery-drill']
);
SQL

fingerprint() {
  psql "$DB_URL" --tuples-only --no-align --set ON_ERROR_STOP=1 <<SQL
SELECT concat_ws('|',
  p.id::text,
  p.name,
  p.email,
  n.id::text,
  n.title,
  n.user_id::text,
  n.status::text,
  array_to_string(n.tags, ',')
)
FROM public.profiles p
JOIN public.needs n ON n.user_id = p.id
WHERE p.id = '$PROFILE_ID'
  AND n.id = '$NEED_ID';
SQL
}

BEFORE="$(fingerprint)"
EXPECTED="$PROFILE_ID|Recovery Drill Member|recovery-drill@example.invalid|$NEED_ID|Recovery drill need|$PROFILE_ID|active|recovery-drill"

if [[ "$BEFORE" != "$EXPECTED" ]]; then
  echo "Recovery sentinel did not reach the expected pre-backup state" >&2
  exit 1
fi

supabase db dump \
  --local \
  --schema public \
  --data-only \
  --use-copy \
  --file "$BACKUP_FILE"

if [[ ! -s "$BACKUP_FILE" ]]; then
  echo "Recovery dump is empty" >&2
  exit 1
fi

# Simulate loss of the application database by rebuilding exclusively from the
# committed migration chain before applying the logical application-data dump.
supabase db reset --no-seed

ABSENT="$(psql "$DB_URL" --tuples-only --no-align --set ON_ERROR_STOP=1 -c "SELECT count(*) FROM public.profiles WHERE id = '$PROFILE_ID';")"
if [[ "$ABSENT" != "0" ]]; then
  echo "Database reset did not remove the recovery sentinel" >&2
  exit 1
fi

psql \
  "$DB_URL" \
  --single-transaction \
  --set ON_ERROR_STOP=1 \
  --file "$BACKUP_FILE"

AFTER="$(fingerprint)"
if [[ "$AFTER" != "$BEFORE" ]]; then
  echo "Recovered application data does not match the pre-backup sentinel" >&2
  echo "before: $BEFORE" >&2
  echo "after:  $AFTER" >&2
  exit 1
fi

# The rest of SECURITY expects a pristine database. Rebuild once more so this
# destructive proof cannot leak state into security regressions or type checks.
supabase db reset --no-seed

FINAL="$(psql "$DB_URL" --tuples-only --no-align --set ON_ERROR_STOP=1 -c "SELECT count(*) FROM public.profiles WHERE id = '$PROFILE_ID';")"
if [[ "$FINAL" != "0" ]]; then
  echo "Recovery drill cleanup failed" >&2
  exit 1
fi

echo "Application-data recovery drill passed."
