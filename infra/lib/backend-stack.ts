import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface BackendStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const backendRepoName = process.env.ECR_REPO ?? 'project5-backend';

    // ✅ ECS Cluster
    const cluster = new ecs.Cluster(this, 'Project5Cluster', {
      vpc: props.vpc,
    });

    // ✅ ECR Repository
    const repository = ecr.Repository.fromRepositoryName(
      this,
      'BackendRepo',
      backendRepoName
    );

    // ✅ Task Definition (with CPU + Memory)
    const taskDef = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    // ✅ Allow ECS to pull from ECR
    taskDef.addToExecutionRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
        ],
        resources: ['*'],
      })
    );

    // ✅ Container
    const container = taskDef.addContainer('BackendContainer', {
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'backend',
      }),
    });

    // ✅ Port mapping
    container.addPortMappings({
      containerPort: 3000,
    });

    // ✅ Security Group
    const sg = new ec2.SecurityGroup(this, 'BackendSG', {
      vpc: props.vpc,
      allowAllOutbound: true,
    });

    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3000));

    // ✅ ECS Service
    const service = new ecs.FargateService(this, 'BackendService', {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      assignPublicIp: true,
      securityGroups: [sg],
      healthCheckGracePeriod: cdk.Duration.seconds(60),
    });

    // ✅ ALB
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: true,
    });

    const listener = alb.addListener('Listener', {
      port: 80,
    });

    listener.addTargets('ECS', {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      healthCheck: {
        path: '/health',
        healthyHttpCodes: '200',
      },
    });

    // ✅ RDS PostgreSQL
    const db = new rds.DatabaseInstance(this, 'Project5DB', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14,
      }),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      allocatedStorage: 20,
      publiclyAccessible: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // ⚠️ auto delete DB (good for testing)
    });

    // ✅ Output ALB URL
    new cdk.CfnOutput(this, 'ALBURL', {
      value: alb.loadBalancerDnsName,
    });
  }
}