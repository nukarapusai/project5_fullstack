import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as rds from 'aws-cdk-lib/aws-rds';

export interface BackendStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class BackendStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const cluster = new ecs.Cluster(this, 'Project5Cluster', {
      vpc: props.vpc
    });

    const repository = new ecr.Repository(this, 'BackendRepo');

    const taskDef = new ecs.FargateTaskDefinition(this, 'TaskDef');

    const container = taskDef.addContainer('BackendContainer', {
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      memoryLimitMiB: 512
    });

    container.addPortMappings({
      containerPort: 80
    });

    const service = new ecs.FargateService(this, 'BackendService', {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      assignPublicIp: true
    });

    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: true
    });

    const listener = alb.addListener('Listener', {
      port: 80
    });

    listener.addTargets('ECS', {
      port: 80,
      targets: [service]
    });

    const db = new rds.DatabaseInstance(this, 'Project5DB', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14
      }),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      )
    });

  }
}