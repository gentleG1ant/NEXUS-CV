# ==============================================================
# Stage 1: Build Frontend (React + Vite)
# ==============================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend-react

COPY frontend-react/package*.json ./
RUN npm ci

COPY frontend-react/ ./
RUN npm run build

# ==============================================================
# Stage 2: Build Backend Gateway (Java 17 + Spring Boot)
# ==============================================================
FROM maven:3-eclipse-temurin-17 AS backend-builder
WORKDIR /app/backend-java

COPY backend-java/pom.xml ./
# Pre-fetch maven dependencies for efficient Docker layer caching
RUN mvn dependency:go-offline -B || true

COPY backend-java/src ./src

# Bundle React production build directly into Spring Boot static web assets
COPY --from=frontend-builder /app/frontend-react/dist ./src/main/resources/static

RUN mvn clean package -DskipTests -B

# ==============================================================
# Stage 3: Unified Production Runtime (Python 3.10 + Java 17 JRE)
# ==============================================================
FROM python:3.10-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PORT=8080

# Install Java Headless JRE, curl, and procps
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        default-jre-headless \
        curl \
        procps \
        && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python microservice codebase
COPY api/ ./api/
COPY dal/ ./dal/
COPY ingestion/ ./ingestion/
COPY ml/ ./ml/
COPY preprocessing/ ./preprocessing/
COPY ranking/ ./ranking/
COPY scoring/ ./scoring/
COPY vectorization/ ./vectorization/

# Copy packaged Spring Boot JAR from Stage 2
COPY --from=backend-builder /app/backend-java/target/*.jar /app/app.jar

# Setup runtime directories for embedded DB and uploaded resumes
RUN mkdir -p /app/data /app/data/resumes

# Copy container startup entrypoint
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/app/docker-entrypoint.sh"]
