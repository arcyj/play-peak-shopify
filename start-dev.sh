#!/bin/bash

# Stop any existing processes
echo "Stopping existing processes..."
pkill -f "shopify theme dev" 2>/dev/null
pkill -f "tailwindcss.*watch" 2>/dev/null
lsof -ti:9292 | xargs kill -9 2>/dev/null

# Wait a moment for processes to stop
sleep 2

# Clear any cached files
echo "Clearing cache..."
rm -rf .shopify/cache 2>/dev/null
rm -rf node_modules/.cache 2>/dev/null

# Start development server with hot reloading completely disabled
echo "Starting Shopify theme development server..."
echo "Hot reloading is DISABLED to prevent rate limiting issues."
echo "You'll need to manually refresh your browser to see changes."
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

shopify theme dev \
  --live-reload off \
  --ignore "node_modules/**" \
  --ignore "*.log" \
  --ignore ".git/**" \
  --ignore ".shopify/**" \
  --ignore "package.json" \
  --ignore "package-lock.json" \
  --ignore "tailwind.config.js" \
  --ignore "README.md" \
  --ignore "LICENSE.md" \
  --ignore "dev-optimize.js" \
  --ignore "start-dev.sh" \
  --ignore "*.tmp" \
  --ignore "*.bak" \
  --ignore ".DS_Store" \
  --ignore "Thumbs.db"
