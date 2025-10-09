#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SynapsyxUiDevStack } from '../lib/synapsyx-ui-dev-stack';
import { SynapsyxUiProdStack } from '../lib/synapsyx-ui-prod-stack';

const app = new cdk.App();

// Development Stack
new SynapsyxUiDevStack(app, 'SynapsyxUiDevStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Synapsyx UI Development Environment',
});

// Production Stack
new SynapsyxUiProdStack(app, 'SynapsyxUiProdStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Synapsyx UI Production Environment',
});
