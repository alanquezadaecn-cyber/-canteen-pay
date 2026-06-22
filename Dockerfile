# Build stage - Frontend
FROM node:18-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend .
RUN npm ci --legacy-peer-deps && npm run build

# Production stage
FROM node:18-slim
WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy backend and install dependencies
COPY backend ./backend
WORKDIR /app/backend
RUN npm ci --legacy-peer-deps

# Generate Prisma client (may fail but we continue)
RUN npx prisma generate || true

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist /app/public

# Copy startup script
COPY backend/start.sh /app/backend/start.sh
RUN chmod +x /app/backend/start.sh

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 0

# Start app
CMD ["/app/backend/start.sh"]
