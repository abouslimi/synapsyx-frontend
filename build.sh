#!/bin/bash

# Build script for Synapsyx UI
# Usage: ./build.sh [dev|prod]

set -e

STAGE=${1:-dev}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔨 Building Synapsyx UI for stage: $STAGE"

# Validate stage
if [[ "$STAGE" != "dev" && "$STAGE" != "prod" ]]; then
    echo "❌ Error: Stage must be 'dev' or 'prod'"
    exit 1
fi

# Set environment variables based on stage
if [ "$STAGE" = "dev" ]; then
    export VITE_API_BASE_URL="https://dev-api.synapsyx.tn"
    echo "🔧 Using dev API endpoint: $VITE_API_BASE_URL"
    echo "📋 OpenAPI spec available at: https://dev-api.synapsyx.tn/openapi.json"
else
    export VITE_API_BASE_URL="https://api.synapsyx.tn"
    echo "🔧 Using prod API endpoint: $VITE_API_BASE_URL"
    echo "📋 OpenAPI spec available at: https://api.synapsyx.tn/openapi.json"
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf "$PROJECT_ROOT/dist"

# Install dependencies if needed
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the application
echo "🏗️  Building React application..."
npm run build

echo "✅ Build completed successfully!"
echo "📁 Build output: $PROJECT_ROOT/dist"
