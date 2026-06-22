#!/bin/bash
set -x  # Print commands

echo "========================================="
echo "🚀 Canteen Pay Backend Startup"
echo "========================================="

echo "📋 Environment:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."

echo ""
echo "📦 Checking Prisma..."
if [ -f ".prisma/client/index.js" ]; then
  echo "✅ Prisma client exists"
else
  echo "⚠️ Prisma client missing - generating..."
  npx prisma generate || echo "⚠️ Prisma generation skipped"
fi

echo ""
echo "🎯 Starting Node.js app..."
exec node src/app.js
