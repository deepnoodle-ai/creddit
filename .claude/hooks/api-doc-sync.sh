#!/usr/bin/env bash
set -euo pipefail

# PostToolUse hook: detect drift between API route files and endpoint docs.
# Receives hook JSON on stdin with tool_input.file_path.
# Outputs JSON {"message":"..."} when mismatches found; silent when in sync.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only run for API route or API doc edits
case "$FILE_PATH" in
  */app/routes/api.*.ts | */docs/api/*.md) ;;
  *) exit 0 ;;
esac

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
ROUTES_DIR="$PROJECT_DIR/app/routes"
DOCS_FILE="$PROJECT_DIR/docs/api/api-endpoints.md"

[[ -f "$DOCS_FILE" ]] || exit 0

# --- Collect route-file endpoints ---
declare -A ROUTE_ENDPOINTS

for route_file in "$ROUTES_DIR"/api.*.ts; do
  [[ -f "$route_file" ]] || continue

  base=$(basename "$route_file" .ts)

  # Convert filename to URL path: dots → /, $param → :param
  path="/$(echo "$base" | sed 's/\./\//g; s/\$\([a-zA-Z_]*\)/:\1/g')"

  # loader export → GET
  if grep -q 'export async function loader' "$route_file"; then
    ROUTE_ENDPOINTS["GET $path"]=1
  fi

  # action export → determine HTTP method
  if grep -q 'export async function action' "$route_file"; then
    # Explicit method guard: request.method !== 'METHOD' → accepts METHOD
    method=$(grep -oP "request\.method\s*!==?\s*'\K\w+" "$route_file" | head -1 || true)
    if [[ -n "$method" ]]; then
      ROUTE_ENDPOINTS["$method $path"]=1
    else
      # No guard → default action method is POST
      ROUTE_ENDPOINTS["POST $path"]=1
    fi
  fi
done

# --- Collect documented endpoints from ### METHOD /api/... headings ---
declare -A DOC_ENDPOINTS

while IFS= read -r line; do
  if [[ "$line" =~ ^###[[:space:]]+(GET|POST|PUT|PATCH|DELETE)[[:space:]]+(/api/[^ ]*) ]]; then
    DOC_ENDPOINTS["${BASH_REMATCH[1]} ${BASH_REMATCH[2]}"]=1
  fi
done < "$DOCS_FILE"

# --- Compare ---
undocumented=()
stale=()

for endpoint in "${!ROUTE_ENDPOINTS[@]}"; do
  [[ -n "${DOC_ENDPOINTS[$endpoint]+x}" ]] || undocumented+=("$endpoint")
done

for endpoint in "${!DOC_ENDPOINTS[@]}"; do
  [[ -n "${ROUTE_ENDPOINTS[$endpoint]+x}" ]] || stale+=("$endpoint")
done

# --- Report ---
if [[ ${#undocumented[@]} -eq 0 && ${#stale[@]} -eq 0 ]]; then
  exit 0
fi

msg="API doc drift detected:"

if [[ ${#undocumented[@]} -gt 0 ]]; then
  msg+=$'\n\nUndocumented routes (route file exists, missing from docs):'
  while IFS= read -r e; do
    msg+=$'\n'"  - $e"
  done < <(printf '%s\n' "${undocumented[@]}" | sort)
fi

if [[ ${#stale[@]} -gt 0 ]]; then
  msg+=$'\n\nStale docs (documented but no matching route file):'
  while IFS= read -r e; do
    msg+=$'\n'"  - $e"
  done < <(printf '%s\n' "${stale[@]}" | sort)
fi

jq -n --arg msg "$msg" '{"message": $msg}'
