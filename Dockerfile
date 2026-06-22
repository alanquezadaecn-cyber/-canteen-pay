# Build stage - Frontend
FROM node:18-slim AS frontend
WORKDIR /app/frontend
COPY frontend .
RUN npm install --legacy-peer-deps && npm run build 2>&1 || true

# Backend stage
FROM node:18-slim
WORKDIR /app/backend
COPY backend .
RUN npm install --legacy-peer-deps

EXPOSE 3001
CMD ["node", "src/app.js"]
