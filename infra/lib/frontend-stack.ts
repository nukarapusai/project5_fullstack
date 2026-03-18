import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

export class FrontendStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'FrontendBucket', {
      websiteIndexDocument: 'index.html',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false
    });

    const distribution = new cloudfront.Distribution(this, 'CDN', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket)
      }
    });

  }
}