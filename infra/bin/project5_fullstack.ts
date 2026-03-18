import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { BackendStack } from '../lib/backend-stack';
import { FrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();

const network = new NetworkStack(app, 'NetworkStack');

new BackendStack(app, 'BackendStack', {
  vpc: network.vpc,
});

new FrontendStack(app, 'FrontendStack');
