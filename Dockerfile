# Build stage - Frontend
FROM node:18-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend .
RUN npm install --legacy-peer-deps && npm run build 2>&1 || echo "Frontend build optional"

# Production stage
FROM node:18-slim
WORKDIR /app/backend

# Copy backend
COPY backend .

# Install dependencies
RUN npm install --legacy-peer-deps

# Expose and run
EXPOSE 3001
CMD ["node", "src/app-minimal.js"]
