#!/bin/bash
set -e
cd "$(dirname "$0")"

# Ensure Python venv exists
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
fi

# Ensure node_modules exists
if [ ! -d "frontend-react/node_modules" ]; then
    echo "Installing frontend dependencies..."
    (cd frontend-react && npm ci)
fi

export JWT_SECRET=${JWT_SECRET:-$(openssl rand -base64 32)}
export AI_SERVICE_KEY=${AI_SERVICE_KEY:-$(openssl rand -base64 32)}
export APP_BOOTSTRAP_ADMIN_PASSWORD=${APP_BOOTSTRAP_ADMIN_PASSWORD:-admin12345678}

echo "Starting Python FastAPI scoring service on port 8000..."
.venv/bin/python3 -m uvicorn api.main:app --host 127.0.0.1 --port 8000 &
PID_PY=$!

echo "Starting Spring Boot API Gateway on port 8080..."
(cd backend-java && ./mvnw spring-boot:run) &
PID_JAVA=$!

echo "Starting React Frontend on port 5173..."
(cd frontend-react && npm run dev) &
PID_REACT=$!

cleanup() {
  echo "Stopping services..."
  kill $PID_PY $PID_JAVA $PID_REACT 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo ""
echo "========================================================="
echo " Nexus CV is starting in GitHub Codespaces!"
echo " React UI:        http://localhost:5173"
echo " Initial Admin:   admin"
echo " Initial Pass:    admin12345678"
echo "========================================================="
echo "Press Ctrl+C to stop all services."
echo ""

wait
