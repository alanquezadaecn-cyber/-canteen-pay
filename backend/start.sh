#!/bin/sh
echo "🚀 Starting Canteen Pay Backend"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

echo "Checking Prisma client..."
if [ -d ".prisma/client" ]; then
  echo "✅ Prisma ready"
else
  echo "Generating Prisma client..."
  npx prisma generate || true
fi

echo "Starting app..."
exec node src/app.js
