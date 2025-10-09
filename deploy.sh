#!/bin/bash

# Synapsyx UI Deployment Script
# Usage: ./deploy.sh [dev|prod]

set -e

STAGE=${1:-dev}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFRA_DIR="$PROJECT_ROOT/infrastructure"
DIST_DIR="$PROJECT_ROOT/dist"

echo "🚀 Starting deployment for stage: $STAGE"
echo "📁 Project root: $PROJECT_ROOT"

# Validate stage
if [[ "$STAGE" != "dev" && "$STAGE" != "prod" ]]; then
    echo "❌ Error: Stage must be 'dev' or 'prod'"
    exit 1
fi

# Check if dist directory exists
if [ ! -d "$DIST_DIR" ]; then
    echo "📦 Building React app..."
    cd "$PROJECT_ROOT"
    npm run build
else
    echo "✅ Dist directory exists, skipping build"
fi

# Install CDK dependencies if needed
if [ ! -d "$INFRA_DIR/node_modules" ]; then
    echo "📦 Installing CDK dependencies..."
    cd "$INFRA_DIR"
    npm install
fi

# Deploy infrastructure
echo "🏗️  Deploying infrastructure for $STAGE..."
cd "$INFRA_DIR"

if [ "$STAGE" = "dev" ]; then
    npm run deploy:dev
else
    npm run deploy:prod
fi

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your CloudFlare DNS to point to the CloudFront distribution"
echo "2. Set up SSL certificate in CloudFlare"
echo "3. Configure environment variables for your API endpoints"
echo ""
echo "🔗 CloudFront Distribution Domain:"
if [ "$STAGE" = "dev" ]; then
    echo "   dev.synapsyx.tn"
else
    echo "   synapsyx.tn"
fi
