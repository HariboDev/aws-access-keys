import * as CDK from '@aws-cdk/core';
import * as LambdaNodeJS from '@aws-cdk/aws-lambda-nodejs';
import * as path from 'path';
import * as Lambda from '@aws-cdk/aws-lambda';
import * as IAM from '@aws-cdk/aws-iam';

export class CheckKeysLambdaStack extends CDK.Stack {

  public readonly _CheckKeysLambdaFunction: LambdaNodeJS.NodejsFunction;

  constructor(scope: CDK.Construct, id: string, props?: CDK.StackProps) {
    super(scope, id, props);

    // ===================================================================
    // Resource: Lambda Function Props
    // ===================================================================

    const nodeJsFunctionProps: LambdaNodeJS.NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk'
        ],
        nodeModules: [
          'es6-template-strings'
        ],
      },
      depsLockFilePath: path.join(__dirname, 'lambdas', 'package-lock.json'),
      runtime: Lambda.Runtime.NODEJS_14_X,
      timeout: CDK.Duration.seconds(10)
    };

    // ===================================================================
    // Resource: Lambda Function Roles
    // ===================================================================

    const checkKeysLambdaRole = new IAM.Role(this, 'checkKeysLambdaRole', {
      roleName: 'checkKeysLambdaRole',
      assumedBy: new IAM.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        IAM.ManagedPolicy.fromAwsManagedPolicyName('AWSLambdaExecute')
      ]
    });

    checkKeysLambdaRole.addToPrincipalPolicy(new IAM.PolicyStatement({
      effect: IAM.Effect.ALLOW,
      actions: [
        'iam:ListUsers',
        'iam:ListAccessKeys',
        'iam:DeleteAccessKey'
      ],
      resources: [
        '*'
      ]
    }));

    checkKeysLambdaRole.addToPrincipalPolicy(new IAM.PolicyStatement({
      effect: IAM.Effect.ALLOW,
      actions: [
        'ses:SendEmail',
        'ses:SendRawEmail'
      ],
      resources: [
        '*'
      ]
    }));

    // ===================================================================
    // Resource: Lambda Function
    // ===================================================================

    this._CheckKeysLambdaFunction = new LambdaNodeJS.NodejsFunction(this, 'checkKeysLambda', {
      entry: path.join(__dirname, 'lambdas', 'check-keys.ts'),
      ...nodeJsFunctionProps,
      role: checkKeysLambdaRole
    });
  }
}
