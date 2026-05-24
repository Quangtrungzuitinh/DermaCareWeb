#!/bin/bash
cd /home/longha/Desktop/clinic_booking_main

# Set environment to disable pager
export PAGER=""
export PGPAGER=""

# Delete and reset migrations
echo "=== Resetting migration history ==="
PGPASSWORD="longha2020@123" psql -U postgres.whryockfrblzjrlibuna -h aws-1-ap-south-1.pooler.supabase.com -p 5432 -d postgres << 'SQLEOF'
DELETE FROM _prisma_migrations;
SQLEOF

echo "=== Running migration deploy ==="
npx prisma migrate deploy

echo "=== Done ==="
