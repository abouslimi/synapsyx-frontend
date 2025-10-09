# Environment Configuration

This project uses environment variables to configure API endpoints dynamically for different environments (development, staging, production).

## Environment Variables

### Required Variables

- `VITE_API_BASE_URL`: The base URL for the API server
  - Development: `http://localhost:5001` (default)
  - Production: Set to your production API URL (e.g., `https://api.yourdomain.com`)

## Configuration Files

### API Configuration (`src/lib/apiConfig.ts`)

This file centralizes API configuration and provides:
- Dynamic API base URL resolution
- Helper functions for building API URLs
- Common API endpoints constants

### Usage

The API configuration is automatically used throughout the application:

```typescript
import { buildApiUrl, API_ENDPOINTS } from '@/lib/apiConfig';

// Build a full API URL
const loginUrl = buildApiUrl(API_ENDPOINTS.LOGIN);

// Or use predefined endpoints
const adobeConfigUrl = buildApiUrl(API_ENDPOINTS.ADOBE_CONFIG);
```

## Setting Environment Variables

### Development
Create a `.env.local` file in the project root:
```
VITE_API_BASE_URL=http://localhost:5001
```

### Production
Set the environment variable in your deployment platform:
```
VITE_API_BASE_URL=https://your-api-domain.com
```

## Vite Configuration

The `vite.config.ts` file includes a fallback configuration that provides the default development URL if no environment variable is set.

## Migration Notes

All hardcoded `localhost:5001` references have been replaced with dynamic configuration:
- Login redirects in all pages
- API requests in queryClient
- Adobe PDF viewer configuration
- All other API calls

This ensures the application works seamlessly across different environments without code changes.
