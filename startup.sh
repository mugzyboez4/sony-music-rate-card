#!/bin/bash
# Azure App Service startup script for Sony Music Rate Card Calculator

echo "Starting Sony Music Rate Card Calculator..."

# Install dependencies
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# Build the application
echo "Building application..."
pnpm build

# Start the production server
echo "Starting production server..."
NODE_ENV=production node dist/index.js
