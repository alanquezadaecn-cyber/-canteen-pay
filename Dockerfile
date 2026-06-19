# Build stage - Frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps
COPY frontend .
RUN npm run build

# Build stage - Backend
FROM node:18-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production --legacy-peer-deps

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy backend
COPY backend .
RUN npm ci --legacy-peer-deps

# Copy built frontend to backend public directory
COPY --from=frontend-build /app/frontend/dist ./public

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start backend server
CMD ["npm", "start"]
