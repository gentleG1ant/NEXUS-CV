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

# Use deterministic default secrets matching application.yml and api/main.py
export JWT_SECRET=${JWT_SECRET:-nexus-cv-default-local-jwt-secret-key-32bytes-minimum}
export AI_SERVICE_KEY=${AI_SERVICE_KEY:-nexus-cv-default-local-ai-key}
export APP_BOOTSTRAP_ADMIN_PASSWORD=${APP_BOOTSTRAP_ADMIN_PASSWORD:-admin12345678}

# Ensure script and Maven wrapper are executable
chmod +x start-codespace.sh backend-java/mvnw 2>/dev/null || true

# Ensure data directories exist for H2 and resume storage
mkdir -p backend-java/data backend-java/data/resumes

# Clean up any previous background processes and free up ports
echo "Cleaning up any previous processes and ports..."
fuser -k 8080/tcp 2>/dev/null || true
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 5173/tcp 2>/dev/null || true
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "AIResumeGateway" 2>/dev/null || true
pkill -f "uvicorn api.main" 2>/dev/null || true
sleep 2

echo "Starting Python FastAPI scoring service on port 8000..."
.venv/bin/python3 -m uvicorn api.main:app --host 127.0.0.1 --port 8000 &
PID_PY=$!

echo "Starting Spring Boot API Gateway on port 8080..."
(cd backend-java && ./mvnw clean spring-boot:run) &
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
