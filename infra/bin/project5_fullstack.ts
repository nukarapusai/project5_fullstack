import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { BackendStack } from '../lib/backend-stack';
import { FrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();
const qualifier = process.env.CDK_QUALIFIER ?? 'p5fullstck';
const stackDefaults: cdk.StackProps = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  synthesizer: new cdk.DefaultStackSynthesizer({
    qualifier,
  }),
};

const network = new NetworkStack(app, 'NetworkStackDev', stackDefaults);

new BackendStack(app, 'BackendStack', {
  ...stackDefaults,
  vpc: network.vpc,
});

new FrontendStack(app, 'FrontendStack', stackDefaults);
