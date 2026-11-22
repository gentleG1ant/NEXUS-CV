#!/bin/bash
set -e

export JWT_SECRET="${JWT_SECRET:-nexus-cv-default-local-jwt-secret-key-32bytes-minimum}"
export AI_SERVICE_KEY="${AI_SERVICE_KEY:-nexus-cv-default-local-ai-key}"
export APP_BOOTSTRAP_ADMIN_PASSWORD="${APP_BOOTSTRAP_ADMIN_PASSWORD:-admin12345678}"
export PORT="${PORT:-8080}"

echo "=========================================================="
echo " Starting NEXUS-CV 24/7 Production Stack"
echo " Web Gateway Port: ${PORT}"
echo "=========================================================="

# Start Python FastAPI AI Scoring Service (port 8000) in background
echo "Starting internal Python AI scoring microservice..."
python3 -m uvicorn api.main:app --host 127.0.0.1 --port 8000 &
PYTHON_PID=$!

# Health check to ensure Python service is alive before Spring Boot handles traffic
echo "Waiting for Python AI microservice to become healthy..."
for i in $(seq 1 30); do
    if curl -s http://127.0.0.1:8000/health | grep -q "ok"; then
        echo "Python AI microservice is ready (PID: $PYTHON_PID)."
        break
    fi
    sleep 1
done

# Signal trap for clean graceful shutdown
cleanup() {
    echo "Stopping services..."
    kill -TERM "$PYTHON_PID" 2>/dev/null || true
    wait "$PYTHON_PID" 2>/dev/null || true
    exit 0
}
trap cleanup SIGTERM SIGINT

# Start Java Spring Boot Application Gateway (runs in foreground, binds to $PORT)
echo "Starting Java Spring Boot Gateway on port ${PORT}..."
java -Dserver.port="${PORT}" -jar /app/app.jar
