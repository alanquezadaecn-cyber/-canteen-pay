FROM node:18-slim

# Metadata
LABEL version="1.0"
LABEL description="Canteen Pay Backend"

# Working directory
WORKDIR /backend

# Copy package files
COPY backend/package.json .
COPY backend/package-lock.json* .

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy Prisma schema and migrations (REQUIRED BEFORE generate)
COPY backend/prisma ./prisma

# Generate Prisma client (CRITICAL - must happen during build)
RUN npx prisma generate

# Copy source code
COPY backend/src ./src

# Expose port
EXPOSE 8080

# Start application
CMD ["node", "src/app.js"]
