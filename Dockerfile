FROM node:18-slim

# Metadata
LABEL version="1.0"
LABEL description="Canteen Pay Backend"

# Working directory
WORKDIR /backend

# Copy everything needed
COPY backend/package.json .
COPY backend/package-lock.json* .

# Install
RUN npm install --legacy-peer-deps

# Copy source
COPY backend/src ./src

# Expose port
EXPOSE 3001

# Start with debug output
CMD ["sh", "-c", "echo 'NODE VERSION:' && node --version && echo 'PWD:' && pwd && echo 'FILES:' && ls -la && echo 'SRC:' && ls -la src/ && echo 'STARTING SERVER...' && node src/server.js"]
