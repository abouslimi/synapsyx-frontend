import * as cdk from 'aws-cdk-lib';
import { SynapsyxUiBaseStack, SynapsyxUiStackProps } from './synapsyx-ui-base-stack';

export class SynapsyxUiProdStack extends SynapsyxUiBaseStack {
  constructor(scope: cdk.App, id: string, props: Omit<SynapsyxUiStackProps, 'stage' | 'domainName'>) {
    super(scope, id, {
      ...props,
      stage: 'prod',
      domainName: 'synapsyx.tn',
    });

    // Add any prod-specific configurations here
    this.addProdSpecificConfigurations();
  }

  private addProdSpecificConfigurations(): void {
    // Add prod-specific tags
    cdk.Tags.of(this).add('Environment', 'prod');
    cdk.Tags.of(this).add('Project', 'synapsyx-ui');
    cdk.Tags.of(this).add('Stage', 'prod');
    
    // Add additional security configurations for production
    cdk.Tags.of(this.bucket).add('DataClassification', 'public');
    cdk.Tags.of(this.distribution).add('SecurityLevel', 'high');
  }
}
