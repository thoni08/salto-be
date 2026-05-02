#!/usr/bin/env bash
set -euo pipefail

# curl-based API test script for seeded data
# Usage: BASE_URL=http://localhost:3000 ./postman/curl_tests.sh
# Requires: curl and jq

BASE_URL=${BASE_URL:-http://localhost:3000}
EMAIL=${EMAIL:-budisantoso@salto.local}
# Do NOT hardcode passwords. Require PASSWORD as an environment variable.
PASSWORD=${PASSWORD:-}

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required but not installed. Install jq and re-run. (eg: sudo apt install jq)"
  exit 2
fi

echo "Base URL: $BASE_URL"
echo

echo "==> 1) Health check (no auth)"
curl -sS "$BASE_URL/health" | jq '.' || true
echo -e "\n"

echo "==> 2) Test endpoint (no auth)"
curl -sS "$BASE_URL/api/test" | jq '.' || true
echo -e "\n"


if [ -z "$PASSWORD" ]; then
  echo "PASSWORD environment variable is not set. To run authenticated tests, set PASSWORD without exposing it in logs or messages."
  echo "Example: PASSWORD=your_password_here BASE_URL=$BASE_URL EMAIL=$EMAIL ./postman/curl_tests.sh"
  exit 4
fi

echo "==> 3) Login with seeded user ($EMAIL)"
LOGIN_RESP=$(curl -sS -X POST "$BASE_URL/api/login" -H "Content-Type: application/json" -d '{"email":"'"$EMAIL"'","password":"'"$PASSWORD"'"}')
# print response with token redacted
echo "$LOGIN_RESP" | jq 'del(.token)'

TOKEN=$(echo "$LOGIN_RESP" | jq -r '.token // empty')
USER_ID=$(echo "$LOGIN_RESP" | jq -r '.user.id // empty')

if [ -z "$TOKEN" ] || [ -z "$USER_ID" ]; then
  echo "Login failed or response didn't include token/user id. Aborting authenticated tests."
  exit 3
fi

echo -e "\nLogin succeeded. user id: $USER_ID\n"

AUTH_HEADER=( -H "Authorization: Bearer $TOKEN" )

echo "==> 4) GET /api/profile (auth)"
curl -sS "$BASE_URL/api/profile" "${AUTH_HEADER[@]}" | jq '.' || true
echo -e "\n"

echo "==> 5) GET /api/home (public)"
curl -sS "$BASE_URL/api/home" | jq '.' || true
echo -e "\n"

echo "==> 6) GET /api/users (auth, page=1 limit=5)"
USERS_JSON=$(curl -sS "$BASE_URL/api/users?page=1&limit=5" "${AUTH_HEADER[@]}")
echo "$USERS_JSON" | jq '.' || true
echo -e "\n"

# pick a target user id that's not the logged-in user
TARGET_USER_ID=$(echo "$USERS_JSON" | jq -r '.data[]?.id' | grep -v "^$USER_ID$" | head -n1 || true)
if [ -z "$TARGET_USER_ID" ]; then
  # fallback: use logged in user
  TARGET_USER_ID="$USER_ID"
fi

echo "Using target user id: $TARGET_USER_ID"
echo -e "\n"

echo "==> 7) GET /api/users/top-alumni (auth)"
curl -sS "$BASE_URL/api/users/top-alumni" "${AUTH_HEADER[@]}" | jq '.' || true
echo -e "\n"

echo "==> 8) GET /api/user (current user - auth)"
curl -sS "$BASE_URL/api/user" "${AUTH_HEADER[@]}" | jq '.' || true
echo -e "\n"

echo "==> 9) GET /api/user/:id (target user - auth)"
curl -sS "$BASE_URL/api/user/$TARGET_USER_ID" "${AUTH_HEADER[@]}" | jq '.' || true
echo -e "\n"

echo "==> 10) GET /api/user/:id/is-following (auth)"
curl -sS "$BASE_URL/api/user/$TARGET_USER_ID/is-following" "${AUTH_HEADER[@]}" | jq '.' || true
echo -e "\n"

echo "==> 11) GET /api/threads (public)"
THREADS_JSON=$(curl -sS "$BASE_URL/api/threads?page=1&limit=5" | jq -c '.' )
echo "$THREADS_JSON" | jq '.' || true
echo -e "\n"

FIRST_THREAD_ID=$(echo "$THREADS_JSON" | jq -r '.data[0].id // empty')
if [ -z "$FIRST_THREAD_ID" ]; then
  echo "No thread id found from /api/threads; skipping thread-specific GETs.";
else
  echo "Using thread id: $FIRST_THREAD_ID"
  echo -e "\n"

  echo "==> 12) GET /api/threads/:id"
  curl -sS "$BASE_URL/api/threads/$FIRST_THREAD_ID" | jq '.' || true
  echo -e "\n"

  echo "==> 13) GET /api/threads/:id/comments"
  curl -sS "$BASE_URL/api/threads/$FIRST_THREAD_ID/comments?page=1&limit=5" | jq '.' || true
  echo -e "\n"

  echo "==> 14) GET /api/threads/:id/related"
  curl -sS "$BASE_URL/api/threads/$FIRST_THREAD_ID/related" | jq '.' || true
  echo -e "\n"
fi

echo "All GET endpoint tests completed."
