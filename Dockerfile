# Stage 1: Build Frontend
FROM node:18-slim AS frontend-builder

WORKDIR /frontend

# Copy frontend files
COPY frontend/package.json .
COPY frontend/package-lock.json* .

# Install dependencies
RUN npm install

# Copy source code
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/index.html .
COPY frontend/tsconfig.json .
COPY frontend/vite.config.ts .

# Build frontend
RUN npm run build

# Stage 2: Build Backend with Frontend assets
FROM node:18-slim

LABEL version="1.0"
LABEL description="Canteen Pay - Backend + Frontend"

# Install OpenSSL (required for Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /backend

# Copy backend package files
COPY backend/package.json .
COPY backend/package-lock.json* .

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy Prisma schema and migrations
COPY backend/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy backend source code
COPY backend/src ./src

# Copy compiled frontend assets from stage 1
COPY --from=frontend-builder /frontend/dist /public

# Expose port
EXPOSE 8080

# Start application
CMD ["node", "src/app.js"]
