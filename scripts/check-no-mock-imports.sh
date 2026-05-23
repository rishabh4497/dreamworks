#!/usr/bin/env bash
# Fail if app code imports from `@/lib/mock` (or a relative `../mock` path).
# Mock files exist solely to feed `scripts/seed-firebase.ts`; they must never
# be bundled into the running app.
#
# Run via: yarn check:mock-imports

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Files that match `from "@/lib/mock"` or relative `../mock` paths, excluding
# the mock directory itself.
hits=$(grep -rln -E "from\s+['\"](@/lib/mock|\.\.?(/\.\.)*/mock)" "$ROOT/src" \
  --include="*.ts" --include="*.tsx" \
  | grep -v "/lib/mock/" || true)

if [[ -n "${hits}" ]]; then
  echo "❌ Mock-data imports detected in app code:"
  echo "${hits}" | sed 's/^/  /'
  echo
  echo "Mock files are seed-data only. Move the import into scripts/seed-firebase.ts"
  echo "or add the values to dw_config / a Firestore collection."
  exit 1
fi

echo "✓ No mock-data imports in app code."
