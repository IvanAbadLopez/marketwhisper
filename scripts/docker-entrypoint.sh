#!/bin/sh
set -e

echo "🚀 MarketWhisper - Starting initialization..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
max_retries=30
counter=0

while [ $counter -lt $max_retries ]; do
  if node -e "const {Pool} = require('pg'); const pool = new Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT 1').then(() => {console.log('Connected'); process.exit(0);}).catch(() => process.exit(1));" 2>/dev/null; then
    echo "✅ Database is ready!"
    break
  fi
  counter=$((counter + 1))
  echo "Database is unavailable (attempt $counter/$max_retries) - sleeping"
  sleep 2
done

if [ $counter -eq $max_retries ]; then
  echo "❌ Database connection failed after $max_retries attempts"
  exit 1
fi

# Run migrations using Prisma CLI from node_modules
echo "📦 Running database migrations..."
./node_modules/.bin/prisma migrate deploy

# Seed database
echo "🌱 Seeding database..."
node /app/scripts/seed-demo.js || echo "⚠️  Seeding skipped (may already exist)"

echo "🎉 Initialization complete!"
echo "🚀 Starting Next.js server..."

# Start Next.js
exec node server.js
