# Synapsyx UI Infrastructure

This directory contains AWS CDK infrastructure code for deploying the Synapsyx UI React application to AWS S3 with CloudFront distribution.

## Architecture

The infrastructure consists of:

- **S3 Bucket**: Hosts the static React application files
- **CloudFront Distribution**: Provides CDN functionality and HTTPS
- **Custom Domains**: 
  - Production: `synapsyx.tn`
  - Development: `dev.synapsyx.tn`

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Node.js** (v18 or later)
3. **AWS CDK** installed globally: `npm install -g aws-cdk`
4. **CloudFlare** account with domain `synapsyx.tn` registered

## Quick Start

### 1. Install Infrastructure Dependencies

```bash
npm run infra:install
```

### 2. Bootstrap CDK (First time only)

```bash
cd infrastructure
npx cdk bootstrap
```

### 3. Deploy Development Environment

```bash
npm run deploy:dev
```

### 4. Deploy Production Environment

```bash
npm run deploy:prod
```

## Manual Deployment Steps

### Development Environment

1. **Build the application for dev:**
   ```bash
   npm run build:dev
   ```

2. **Deploy infrastructure:**
   ```bash
   cd infrastructure
   npm run deploy:dev
   ```

3. **Configure CloudFlare DNS:**
   - Add CNAME record: `dev.synapsyx.tn` → CloudFront distribution domain
   - Enable SSL/TLS encryption

### Production Environment

1. **Build the application for prod:**
   ```bash
   npm run build:prod
   ```

2. **Deploy infrastructure:**
   ```bash
   cd infrastructure
   npm run deploy:prod
   ```

3. **Configure CloudFlare DNS:**
   - Add CNAME record: `synapsyx.tn` → CloudFront distribution domain
   - Enable SSL/TLS encryption

## Environment Variables

The application uses environment variables for API configuration:

- **Development**: `VITE_API_BASE_URL=https://dev-api.synapsyx.tn`
- **Production**: `VITE_API_BASE_URL=https://api.synapsyx.tn`

These are automatically set during the build process.

## Resource Naming Convention

All AWS resources follow the naming convention: `synapsyx-ui-{resource-name}-{stage}`

Examples:
- `synapsyx-ui-bucket-dev`
- `synapsyx-ui-distribution-prod`
- `synapsyx-ui-deployment-dev`

## Available Scripts

### Main Project Scripts

- `npm run build:dev` - Build for development
- `npm run build:prod` - Build for production
- `npm run deploy:dev` - Deploy development environment
- `npm run deploy:prod` - Deploy production environment

### Infrastructure Scripts

- `npm run infra:install` - Install CDK dependencies
- `npm run infra:deploy:dev` - Deploy dev infrastructure only
- `npm run infra:deploy:prod` - Deploy prod infrastructure only
- `npm run infra:destroy:dev` - Destroy dev infrastructure
- `npm run infra:destroy:prod` - Destroy prod infrastructure

## CloudFlare Configuration

After deploying the infrastructure, configure CloudFlare:

1. **DNS Records:**
   - `synapsyx.tn` (A record) → CloudFront distribution IP
   - `dev.synapsyx.tn` (CNAME) → CloudFront distribution domain

2. **SSL/TLS Settings:**
   - Set encryption mode to "Full (strict)"
   - Enable "Always Use HTTPS"

3. **Caching:**
   - Set cache level to "Standard"
   - Enable "Browser Cache TTL" (4 hours)

## Troubleshooting

### Common Issues

1. **CDK Bootstrap Required:**
   ```bash
   cd infrastructure
   npx cdk bootstrap
   ```

2. **Permission Issues:**
   - Ensure AWS CLI is configured with appropriate permissions
   - Check IAM policies for S3, CloudFront, and Route53 access

3. **Domain Configuration:**
   - Verify CloudFlare DNS settings
   - Check SSL certificate status

### Useful Commands

```bash
# Check CDK diff before deployment
cd infrastructure
npm run diff:dev
npm run diff:prod

# View stack outputs
aws cloudformation describe-stacks --stack-name SynapsyxUiDevStack
aws cloudformation describe-stacks --stack-name SynapsyxUiProdStack
```

## Security Considerations

- S3 buckets are private with CloudFront OAI
- CloudFront enforces HTTPS redirects
- Error pages redirect to index.html for SPA routing
- All resources are tagged for cost tracking and management

## Cost Optimization

- CloudFront uses Price Class 100 (US, Canada, Europe)
- S3 storage class optimized for static website hosting
- CloudFront caching reduces origin requests

## Monitoring

Monitor your deployment using:
- AWS CloudWatch for CloudFront metrics
- CloudFlare Analytics for traffic insights
- AWS Cost Explorer for cost tracking
