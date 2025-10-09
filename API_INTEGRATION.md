# Synapsyx Frontend API Integration Guide

This document outlines how the Synapsyx frontend integrates with the backend API, ensuring alignment with the OpenAPI specification.

## API Configuration

### Environment-Specific Endpoints

The application supports two environments with different API endpoints:

- **Development**: `https://dev-api.synapsyx.tn`
- **Production**: `https://api.synapsyx.tn`

### Configuration Files

#### `src/lib/apiConfig.ts`
Central configuration file containing:
- API base URL resolution
- All API endpoints based on OpenAPI spec
- TypeScript interfaces for request/response types

#### `src/lib/authHelpers.ts`
Authentication utilities:
- Token extraction from localStorage
- Authorization header generation
- Authenticated fetch wrapper

## API Endpoints Mapping

Based on the [OpenAPI specification](https://dev-api.synapsyx.tn/openapi.json), the frontend uses the following endpoints:

### Authentication Endpoints
- `GET /api/auth/user` - Get current user profile
- `POST /api/auth/register` - Register new user
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/confirm-verification` - Confirm email verification
- `PATCH /api/auth/user/disable` - Disable user account

### User Endpoints
- `GET /api/users/preferences` - Get user preferences
- `POST /api/users/preferences` - Update user preferences
- `GET /api/users/statistics` - Get user statistics

### Course Endpoints
- `GET /api/courses/` - Get courses with filtering
- `GET /api/courses/{course_id}` - Get course details
- `GET /api/courses/{course_id}/questions` - Get course questions
- `GET /api/courses/{course_id}/questions/random` - Get random questions
- `GET /api/courses/{course_id}/statistics` - Get course statistics
- `GET /api/courses/{course_id}/pdf-url` - Get course PDF URL

### Question Endpoints
- `GET /api/questions/` - Get questions
- `GET /api/questions/{question_id}` - Get question details
- `POST /api/questions/{question_id}/answer` - Submit answer

### Quiz Endpoints
- `POST /api/quiz/submit` - Submit quiz
- `GET /api/quiz/results` - Get quiz results

### AI Endpoints
- `POST /api/ai/chat` - AI chat functionality
- `GET /api/ai/credits` - Get AI credits
- `POST /api/ai/summary` - AI summary generation

### Other Endpoints
- `GET /api/schedule` - Get user schedule
- `GET /api/exams` - Get exam results
- `GET /api/subscription` - Get subscription info
- `GET /api/adobe-config` - Get Adobe PDF configuration

## Authentication

All API requests (except registration and health checks) require Bearer token authentication:

```typescript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
```

The frontend automatically includes authentication headers using the `authenticatedFetch` helper function.

## Request/Response Format

### Request Format
- Content-Type: `application/json`
- Authentication: Bearer token in Authorization header
- Query parameters for filtering and pagination

### Response Format
All responses follow the OpenAPI schema:
- Success responses include data payload
- Error responses include error details and HTTP status codes
- Consistent error handling across all endpoints

## TypeScript Types

The frontend includes TypeScript interfaces matching the OpenAPI schema:

```typescript
interface UserResponse {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  // ... other fields
}

interface UserStatisticsResponse {
  total_courses: number;
  completed_courses: number;
  accuracy_percentage: number;
  // ... other fields
}
```

## Error Handling

The frontend implements consistent error handling:

1. **401 Unauthorized**: Redirect to login page
2. **403 Forbidden**: Show access denied message
3. **404 Not Found**: Show not found message
4. **500 Server Error**: Show generic error message

## API Validation

Use the validation script to test API integration:

```bash
# Test development API
npm run validate-api:dev

# Test production API
npm run validate-api:prod
```

The validation script:
- Tests all API endpoints
- Verifies OpenAPI spec accessibility
- Checks response codes
- Downloads and validates OpenAPI specification

## Development Workflow

### 1. Local Development
```bash
# Start development server
npm run dev

# API calls will use: http://localhost:5001 (fallback)
# Or set VITE_API_BASE_URL environment variable
```

### 2. Build for Development
```bash
# Build with dev API endpoint
npm run build:dev
# Uses: https://dev-api.synapsyx.tn
```

### 3. Build for Production
```bash
# Build with prod API endpoint
npm run build:prod
# Uses: https://api.synapsyx.tn
```

### 4. Deploy
```bash
# Deploy development
npm run deploy:dev

# Deploy production
npm run deploy:prod
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check if user is logged in
   - Verify token is not expired
   - Ensure proper token format

2. **CORS Issues**
   - Verify API server CORS configuration
   - Check if credentials are included in requests

3. **API Endpoint Not Found**
   - Verify endpoint URL matches OpenAPI spec
   - Check if endpoint requires authentication
   - Ensure proper HTTP method is used

### Debugging

1. **Check Network Tab**
   - Verify request URLs
   - Check request headers
   - Review response status codes

2. **Use API Validation Script**
   ```bash
   npm run validate-api:dev
   ```

3. **Review OpenAPI Spec**
   - Visit: https://dev-api.synapsyx.tn/openapi.json
   - Compare with frontend API calls

## Best Practices

1. **Always use API_ENDPOINTS constants** instead of hardcoded URLs
2. **Use authenticatedFetch** for authenticated requests
3. **Handle errors consistently** across all API calls
4. **Validate API responses** against TypeScript interfaces
5. **Test both dev and prod environments** before deployment

## OpenAPI Specification

The backend API follows OpenAPI 3.1.0 specification:
- **Development**: https://dev-api.synapsyx.tn/openapi.json
- **Production**: https://api.synapsyx.tn/openapi.json

All frontend API calls are validated against this specification to ensure compatibility and proper integration.
