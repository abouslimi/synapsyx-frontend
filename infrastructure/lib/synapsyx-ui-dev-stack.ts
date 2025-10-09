import * as cdk from 'aws-cdk-lib';
import { SynapsyxUiBaseStack, SynapsyxUiStackProps } from './synapsyx-ui-base-stack';

export class SynapsyxUiDevStack extends SynapsyxUiBaseStack {
  constructor(scope: cdk.App, id: string, props: Omit<SynapsyxUiStackProps, 'stage' | 'domainName'>) {
    super(scope, id, {
      ...props,
      stage: 'dev',
      domainName: 'dev.synapsyx.tn',
    });

    // Add any dev-specific configurations here
    this.addDevSpecificConfigurations();
  }

  private addDevSpecificConfigurations(): void {
    // Add dev-specific tags
    cdk.Tags.of(this).add('Environment', 'dev');
    cdk.Tags.of(this).add('Project', 'synapsyx-ui');
    cdk.Tags.of(this).add('Stage', 'dev');
  }
}
