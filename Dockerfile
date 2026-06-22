# Build stage - Frontend
FROM node:18-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend . || true
RUN npm install --legacy-peer-deps && npm run build || true

# Production stage
FROM node:18-slim

# Copy backend
COPY backend /app/backend
WORKDIR /app/backend

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy frontend build if available
COPY --from=frontend-build /app/frontend/dist /app/public || true

# Expose and run
EXPOSE 3001
CMD ["node", "src/app-minimal.js"]
