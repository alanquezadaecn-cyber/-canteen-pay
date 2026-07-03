FROM node:18-slim

LABEL version="1.0"
LABEL description="Canteen Pay - Backend + Frontend"

# Install OpenSSL (required for Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /backend

# Copy backend package files
COPY backend/package.json .
COPY backend/package-lock.json* .

# Install backend dependencies
RUN npm install --legacy-peer-deps

# Copy Prisma schema
COPY backend/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy backend source
COPY backend/src ./src

# Copy compiled frontend files (CRITICAL)
COPY backend/public ./public

# Expose port
EXPOSE 8080

# Start application
CMD ["node", "src/app.js"]
