#!/usr/bin/env bash
set -euo pipefail

: "${PROD_URL:?PROD_URL is required}"
# No redirects or disabled TLS verification: a parking/login page must not pass.
case "$PROD_URL" in
  https://*) ;;
  *) echo 'Production monitoring requires HTTPS'; exit 1 ;;
esac
origin=${PROD_URL%/}

probe() {
  local label=$1 path=$2 expected=$3 code
  shift 3
  if ! code=$(curl --proto '=https' --tlsv1.2 --silent --show-error --max-time 20 \
      --output /dev/null --write-out '%{http_code}' "$@" "$origin$path"); then
    echo "$label transport/TLS failure"
    return 1
  fi
  case " $expected " in
    *" $code "*) echo "$label HTTP $code" ;;
    *) echo "$label failed with HTTP $code"; return 1 ;;
  esac
}

probe 'Public health' /api/health '200'
if [[ -n ${CONTROL_TOWER_OPERATOR_TOKEN:-} ]]; then
  probe 'Authenticated work queue' /api/intelligence/work-queue/status '200' \
    -H "Authorization: Bearer $CONTROL_TOWER_OPERATOR_TOKEN"
else
  echo 'Authenticated work queue skipped: operator token is not configured'
fi
# Unconfigured internal APIs deliberately fail closed (503); configured ones
# must still reject an unauthenticated caller. Never accept 200 or a redirect.
probe 'Unauthenticated API containment' /api/agents '401 403 503'
