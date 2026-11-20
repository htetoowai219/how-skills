# Optional Module: Docker & Containerization

Lazy-load this reference **ONLY** if Docker setup was requested in the grill. It provides a multi-stage production Dockerfile, `.dockerignore`, and both Infra-only and Full-stack Docker Compose configurations extracted from our production repositories.

---

## 1. Multi-Stage Dockerfile

### `Dockerfile`
```dockerfile
# syntax=docker/dockerfile:1

# ---------- Stage 1: Build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ---------- Stage 2: Production Dependencies ----------
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---------- Stage 3: Runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=5000

# Run as non-root user for security
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package*.json ./

USER node
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 5000) + '/api/v1/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]
```

### `.dockerignore`
```text
node_modules
dist
.env
.git
*.log
.DS_Store
```

---

## 2. Docker Compose Variant A: Infra-Only Compose

Use this variant when running MongoDB (and optionally Redis) in Docker while developing the Express backend natively on the host machine.

### `docker-compose.yml`
```yaml
name: app-infra

services:
  mongodb:
    image: mongo:7
    container_name: app_mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping').ok"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s

  # Optional: Include Redis if Redis module is enabled
  redis:
    image: redis:7-alpine
    container_name: app_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  mongo_data:
  redis_data:
```

---

## 3. Docker Compose Variant B: Full-Stack Compose

Use this variant when running the backend API and all backing services together inside the Docker network.

### `docker-compose.yml`
```yaml
name: app-fullstack

services:
  mongodb:
    image: mongo:7
    container_name: app_mongodb
    restart: unless-stopped
    volumes:
      - mongo_data:/data/db
    networks:
      - app_network
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping').ok"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s

  # Optional: Include Redis if Redis module is enabled
  redis:
    image: redis:7-alpine
    container_name: app_redis
    restart: unless-stopped
    networks:
      - app_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  api:
    build:
      context: .
      target: runtime
    container_name: app_backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      PORT: 5000
      NODE_ENV: production
      MONGO_URI: mongodb://mongodb:27017/my_database
      REDIS_URL: redis://redis:6379
      CLIENT_URL: http://localhost:5173
    env_file:
      - .env
    depends_on:
      mongodb:
        condition: service_healthy
      # redis:
      #   condition: service_healthy
    networks:
      - app_network

networks:
  app_network:
    driver: bridge

volumes:
  mongo_data:
```

---

## 4. Useful Operations
```bash
# Start infrastructure containers in the background
docker compose up -d

# Check container status & health
docker compose ps

# Stop containers and preserve database volumes
docker compose down

# Stop containers and wipe database volumes (clean slate)
docker compose down -v
```
