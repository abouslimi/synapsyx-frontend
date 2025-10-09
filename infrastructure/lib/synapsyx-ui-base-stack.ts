import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export interface SynapsyxUiStackProps extends cdk.StackProps {
  stage: 'dev' | 'prod';
  domainName: string;
}

export abstract class SynapsyxUiBaseStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly stage: string;
  public readonly domainName: string;

  constructor(scope: Construct, id: string, props: SynapsyxUiStackProps) {
    super(scope, id, props);
    
    this.stage = props.stage;
    this.domainName = props.domainName;

    // Create S3 bucket for hosting
    this.bucket = new s3.Bucket(this, `synapsyx-ui-bucket-${props.stage}`, {
      bucketName: `synapsyx-ui-bucket-${props.stage}`,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // Create CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, `synapsyx-ui-distribution-${props.stage}`, {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      domainNames: [props.domainName],
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Output important values
    new cdk.CfnOutput(this, `synapsyx-ui-bucket-name-${props.stage}`, {
      value: this.bucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, `synapsyx-ui-distribution-id-${props.stage}`, {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    new cdk.CfnOutput(this, `synapsyx-ui-distribution-domain-${props.stage}`, {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, `synapsyx-ui-domain-${props.stage}`, {
      value: props.domainName,
      description: 'Custom Domain Name',
    });
  }

  public deployWebsite(sourcePath: string): s3deploy.BucketDeployment {
    return new s3deploy.BucketDeployment(this, `synapsyx-ui-deployment-${this.stage}`, {
      sources: [s3deploy.Source.asset(sourcePath)],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
      prune: true,
    });
  }
}
