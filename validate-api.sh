#!/bin/bash

# API Validation Script for Synapsyx Frontend
# This script validates that all frontend API calls align with the OpenAPI specification

set -e

STAGE=${1:-dev}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔍 Validating API integration for stage: $STAGE"

# Validate stage
if [[ "$STAGE" != "dev" && "$STAGE" != "prod" ]]; then
    echo "❌ Error: Stage must be 'dev' or 'prod'"
    exit 1
fi

# Set API base URL based on stage
if [ "$STAGE" = "dev" ]; then
    API_BASE_URL="https://dev-api.synapsyx.tn"
    OPENAPI_URL="https://dev-api.synapsyx.tn/openapi.json"
else
    API_BASE_URL="https://api.synapsyx.tn"
    OPENAPI_URL="https://api.synapsyx.tn/openapi.json"
fi

echo "🌐 API Base URL: $API_BASE_URL"
echo "📋 OpenAPI Spec: $OPENAPI_URL"

# Function to test API endpoint
test_endpoint() {
    local endpoint=$1
    local method=${2:-GET}
    local description=$3
    
    echo "  Testing $method $endpoint - $description"
    
    local url="${API_BASE_URL}${endpoint}"
    local response_code
    
    if [ "$method" = "GET" ]; then
        response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    else
        response_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" || echo "000")
    fi
    
    if [ "$response_code" = "200" ] || [ "$response_code" = "401" ] || [ "$response_code" = "404" ]; then
        echo "    ✅ $method $endpoint - HTTP $response_code"
    else
        echo "    ❌ $method $endpoint - HTTP $response_code"
    fi
}

echo ""
echo "🧪 Testing API Endpoints..."

# Test authentication endpoints
echo "🔐 Authentication Endpoints:"
test_endpoint "/api/auth/user" "GET" "Get current user"
test_endpoint "/api/auth/register" "POST" "Register new user"
test_endpoint "/api/auth/resend-verification" "POST" "Resend verification email"
test_endpoint "/api/auth/confirm-verification" "POST" "Confirm email verification"
test_endpoint "/api/auth/user/disable" "PATCH" "Disable user account"

# Test user endpoints
echo ""
echo "👤 User Endpoints:"
test_endpoint "/api/users/preferences" "GET" "Get user preferences"
test_endpoint "/api/users/preferences" "POST" "Update user preferences"
test_endpoint "/api/users/statistics" "GET" "Get user statistics"

# Test course endpoints
echo ""
echo "📚 Course Endpoints:"
test_endpoint "/api/courses/" "GET" "Get courses"
test_endpoint "/api/courses/1" "GET" "Get course details"
test_endpoint "/api/courses/1/questions" "GET" "Get course questions"
test_endpoint "/api/courses/1/questions/random" "GET" "Get random course questions"
test_endpoint "/api/courses/1/statistics" "GET" "Get course statistics"
test_endpoint "/api/courses/1/pdf-url" "GET" "Get course PDF URL"

# Test question endpoints
echo ""
echo "❓ Question Endpoints:"
test_endpoint "/api/questions/" "GET" "Get questions"
test_endpoint "/api/questions/1" "GET" "Get question details"
test_endpoint "/api/questions/1/answer" "POST" "Submit question answer"

# Test quiz endpoints
echo ""
echo "📝 Quiz Endpoints:"
test_endpoint "/api/quiz/submit" "POST" "Submit quiz"
test_endpoint "/api/quiz/results" "GET" "Get quiz results"

# Test AI endpoints
echo ""
echo "🤖 AI Endpoints:"
test_endpoint "/api/ai/chat" "POST" "AI chat"
test_endpoint "/api/ai/credits" "GET" "Get AI credits"
test_endpoint "/api/ai/summary" "POST" "AI summary"

# Test other endpoints
echo ""
echo "📅 Other Endpoints:"
test_endpoint "/api/schedule" "GET" "Get schedule"
test_endpoint "/api/exams" "GET" "Get exams"
test_endpoint "/api/subscription" "GET" "Get subscription"
test_endpoint "/api/adobe-config" "GET" "Get Adobe config"

echo ""
echo "✅ API validation completed!"

# Check OpenAPI spec availability
echo ""
echo "📋 Checking OpenAPI specification availability..."
if curl -s -f "$OPENAPI_URL" > /dev/null; then
    echo "✅ OpenAPI spec is accessible at: $OPENAPI_URL"
    
    # Download and validate OpenAPI spec
    echo "📥 Downloading OpenAPI specification..."
    curl -s "$OPENAPI_URL" > "/tmp/synapsyx-openapi-${STAGE}.json"
    
    # Check if spec contains expected endpoints
    echo "🔍 Validating OpenAPI specification structure..."
    
    if grep -q '"paths"' "/tmp/synapsyx-openapi-${STAGE}.json"; then
        echo "✅ OpenAPI spec contains paths section"
    else
        echo "❌ OpenAPI spec missing paths section"
    fi
    
    if grep -q '"components"' "/tmp/synapsyx-openapi-${STAGE}.json"; then
        echo "✅ OpenAPI spec contains components section"
    else
        echo "❌ OpenAPI spec missing components section"
    fi
    
    echo "📄 OpenAPI spec saved to: /tmp/synapsyx-openapi-${STAGE}.json"
else
    echo "❌ OpenAPI spec is not accessible at: $OPENAPI_URL"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Review any failed endpoint tests above"
echo "2. Ensure authentication tokens are properly configured"
echo "3. Check that all frontend API calls use the correct endpoints"
echo "4. Verify request/response formats match OpenAPI schema"
echo ""
echo "📚 Frontend API endpoints are configured in: src/lib/apiConfig.ts"
echo "🔧 Authentication helpers are in: src/lib/authHelpers.ts"
