#!/bin/bash
echo "Creating database..."
npm run db:create
echo "Migrating database..."
npm run db:migrate
echo "Seeding database..."
npm run db:seed