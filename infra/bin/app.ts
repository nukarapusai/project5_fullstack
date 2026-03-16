import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';

const app = new cdk.App();

const network = new NetworkStack(app, 'NetworkStack');


import { BackendStack } from '../lib/backend-stack';

const backend = new BackendStack(app, 'BackendStack', {
  vpc: network.vpc
});


import { FrontendStack } from '../lib/frontend-stack';

new FrontendStack(app, 'FrontendStack');