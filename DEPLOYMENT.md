# Synapsyx UI Deployment Guide

This guide will help you deploy the Synapsyx UI React application to AWS S3 with CloudFront distribution.

## Prerequisites

Before starting, ensure you have:

1. **AWS CLI** installed and configured
2. **Node.js** (v18 or later)
3. **AWS CDK** installed globally: `npm install -g aws-cdk`
4. **CloudFlare** account with domain `synapsyx.tn`

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

```bash
# Deploy development environment
npm run deploy:dev

# Deploy production environment  
npm run deploy:prod
```

### Option 2: Manual Step-by-Step

#### 1. Install Dependencies

```bash
# Install main project dependencies
npm install

# Install infrastructure dependencies
npm run infra:install
```

#### 2. Bootstrap CDK (First time only)

```bash
cd infrastructure
npx cdk bootstrap
```

#### 3. Build and Deploy Development

```bash
# Build for development
npm run build:dev

# Deploy infrastructure
npm run infra:deploy:dev
```

#### 4. Build and Deploy Production

```bash
# Build for production
npm run build:prod

# Deploy infrastructure
npm run infra:deploy:prod
```

## CloudFlare Configuration

After deploying the infrastructure, configure CloudFlare DNS:

### Development Environment

1. Go to CloudFlare DNS settings
2. Add CNAME record:
   - **Name**: `dev`
   - **Target**: CloudFront distribution domain (from CDK output)
   - **Proxy status**: Proxied (orange cloud)

### Production Environment

1. Go to CloudFlare DNS settings  
2. Add CNAME record:
   - **Name**: `@` (root domain)
   - **Target**: CloudFront distribution domain (from CDK output)
   - **Proxy status**: Proxied (orange cloud)

### SSL/TLS Settings

1. Go to SSL/TLS → Overview
2. Set encryption mode to **"Full (strict)"**
3. Enable **"Always Use HTTPS"**

## Environment Variables

The application automatically uses the correct API endpoints:

- **Development**: `https://dev-api.synapsyx.tn`
- **Production**: `https://api.synapsyx.tn`

## Verification

After deployment, verify:

1. **Development**: Visit `https://dev.synapsyx.tn`
2. **Production**: Visit `https://synapsyx.tn`
3. Check browser developer tools for any console errors
4. Verify API calls are using correct endpoints

## Troubleshooting

### Common Issues

1. **CDK Bootstrap Required**
   ```bash
   cd infrastructure
   npx cdk bootstrap
   ```

2. **AWS Permissions**
   - Ensure your AWS credentials have S3, CloudFront, and Route53 permissions
   - Check IAM policies

3. **Domain Not Working**
   - Verify CloudFlare DNS settings
   - Check SSL certificate status
   - Wait for DNS propagation (up to 24 hours)

4. **Build Failures**
   - Check Node.js version (requires v18+)
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Useful Commands

```bash
# Check what will be deployed
cd infrastructure
npm run diff:dev
npm run diff:prod

# View stack outputs
aws cloudformation describe-stacks --stack-name SynapsyxUiDevStack
aws cloudformation describe-stacks --stack-name SynapsyxUiProdStack

# Destroy infrastructure (if needed)
npm run infra:destroy:dev
npm run infra:destroy:prod
```

## Resource Cleanup

To remove all AWS resources:

```bash
# Destroy development environment
npm run infra:destroy:dev

# Destroy production environment
npm run infra:destroy:prod
```

**Warning**: This will permanently delete all resources and data.

## Support

For issues or questions:
1. Check the infrastructure README: `infrastructure/README.md`
2. Review AWS CloudFormation console for stack status
3. Check CloudFlare dashboard for DNS/SSL status
