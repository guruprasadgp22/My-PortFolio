#!/usr/bin/env bash
# Runs the whole Java backend on this computer, against the database in the repo's .env (MongoDB Atlas).
#   npm run backend          (or: bash backend/run-local.sh)
# then, in a second terminal:
#   npm run dev:java         the site at http://localhost:5173, using this backend
# Ctrl+C stops every service. Logs: backend/logs/<service>.log
set -euo pipefail
cd "$(dirname "$0")"

ENV_FILE=../.env
[ -f "$ENV_FILE" ] || { echo "Missing $ENV_FILE (copy .env.example and fill it in)"; exit 1; }
val() { grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }

export MONGODB_URI="$(val MONGODB_URI)"
export MONGODB_DB="$(val MONGODB_DB)"; MONGODB_DB=${MONGODB_DB:-portfolio}
# the session cookie is signed with SESSION_SECRET, or ADMIN_SECRET if that's all .env has
export SESSION_SECRET="$(val SESSION_SECRET)"; SESSION_SECRET=${SESSION_SECRET:-$(val ADMIN_SECRET)}
# only the services on this computer need to share it, so a fresh one each run is fine
export INTERNAL_TOKEN="$(openssl rand -base64 48 | tr -d '\n')"
export YOUTUBE_API_KEY="$(val YOUTUBE_API_KEY)" ANTHROPIC_API_KEY="$(val ANTHROPIC_API_KEY)"
export ALLOWED_ORIGINS='^http://(localhost|127\.0\.0\.1):(5173|4173)$'
export EUREKA_URL=http://localhost:8761/eureka/

[ -n "$MONGODB_URI" ] || { echo "MONGODB_URI is empty in .env"; exit 1; }
[ ${#SESSION_SECRET} -ge 32 ] || { echo "ADMIN_SECRET (or SESSION_SECRET) in .env must be at least 32 characters"; exit 1; }
command -v java >/dev/null || { echo "Install Java 21 or newer"; exit 1; }

for port in 8761 8080 8081 8082 8083 8084 8085 8086 8087; do
  if lsof -nP -iTCP:$port -sTCP:LISTEN >/dev/null 2>&1; then echo "Port $port is already in use. Stop whatever runs there first."; exit 1; fi
done

if [ ! -f api-gateway/target/app-exec.jar ] || [ -n "$(find . -name '*.java' -newer api-gateway/target/app-exec.jar -print -quit)" ] || [ -n "$(find . -name '*.yml' -path '*/src/*' -newer api-gateway/target/app-exec.jar -print -quit)" ]; then
  command -v mvn >/dev/null || { echo "Install Maven to build the backend"; exit 1; }
  echo "Building the backend (first time takes a few minutes)…"
  # "clean" first: iCloud Drive (Documents) leaves "Name 2.class" copies in target/, which break the build
  mvn -q -B clean package -DskipTests
fi

mkdir -p logs
PIDS=()
stop() { echo; echo "Stopping…"; kill "${PIDS[@]}" 2>/dev/null || true; wait 2>/dev/null || true; exit 0; }
trap stop INT TERM

JAVA_OPTS="-Xms32m -Xmx256m -XX:+UseSerialGC -XX:TieredStopAtLevel=1"
start() { java $JAVA_OPTS -jar "$1/target/app-exec.jar" > "logs/$1.log" 2>&1 & PIDS+=($!); }

echo "Starting discovery-server…"
start discovery-server
until curl -fs http://localhost:8761/actuator/health >/dev/null 2>&1; do sleep 1; done

echo "Starting the services…"
for s in auth-service content-service learning-service coding-service contest-service media-service chat-service api-gateway; do start "$s"; done

# ready when the gateway can reach content-service through Eureka
for i in $(seq 120); do
  for p in "${PIDS[@]}"; do kill -0 "$p" 2>/dev/null || { echo "A service stopped. See backend/logs/ (grep -l ERROR backend/logs/*.log)"; stop; }; done
  code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/api/content || true)
  [ "$code" = 200 ] && break
  sleep 2
done
[ "$code" = 200 ] || { echo "The backend didn't come up in time. See backend/logs/"; stop; }

cat <<EOF

Backend is running: http://localhost:8080   (Eureka dashboard: http://localhost:8761)
  database: $MONGODB_DB on MongoDB Atlas
  site:     in another terminal run  npm run dev:java  and open http://localhost:5173
            (sign in at http://localhost:5173/#admin with your usual admin password)
Ctrl+C to stop.
EOF
wait
