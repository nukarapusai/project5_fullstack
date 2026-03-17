import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { BackendStack } from '../lib/backend-stack';
import { FrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();

// 1. Network
const network = new NetworkStack(app, 'NetworkStack');

// 2. Backend (ECS, ALB, RDS)
new BackendStack(app, 'BackendStack', {
  vpc: network.vpc,
});

// 3. Frontend (S3 + CloudFront)
new FrontendStack(app, 'FrontendStack');