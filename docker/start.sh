#!/bin/sh
set -eu

echo "Applying Prisma migrations..."
until npx prisma migrate deploy; do
  echo "Database is not ready yet. Retrying in 5 seconds..."
  sleep 5
done

echo "Starting Next.js..."
exec ./node_modules/.bin/next start -H 0.0.0.0 -p "${PORT:-3000}"
