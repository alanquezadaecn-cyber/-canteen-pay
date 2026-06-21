# Build stage - Frontend
FROM node:18-slim AS frontend-build
WORKDIR /app
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm ci --legacy-peer-deps
RUN npm run build

# Production stage
FROM node:18-slim
WORKDIR /app

# Install OpenSSL required by Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy backend
COPY backend ./backend
WORKDIR /app/backend
RUN npm ci --legacy-peer-deps
# Generate Prisma client without connecting to database
RUN npx prisma generate 2>&1 || echo "Prisma generate warning (will retry at runtime)"

# Copy built frontend to backend public directory
WORKDIR /app
COPY --from=frontend-build /app/frontend/dist ./public

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Set working directory to backend for npm
WORKDIR /app/backend

# Start backend server
CMD ["npm", "start"]
