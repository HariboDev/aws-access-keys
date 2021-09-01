import * as CDK from '@aws-cdk/core';
import * as LambdaNodeJS from '@aws-cdk/aws-lambda-nodejs';
import * as EventBridge from '@aws-cdk/aws-events';
import * as Targets from '@aws-cdk/aws-events-targets';

interface EventBridgeProps extends CDK.StackProps {
  checkKeysLambdaFunction: LambdaNodeJS.NodejsFunction;
}

export class EventBridgeStack extends CDK.Stack {
  constructor(scope: CDK.Construct, id: string, props: EventBridgeProps) {
    super(scope, id, props);

    const checkKeysLambdaFunction = props.checkKeysLambdaFunction;

    // ===================================================================
    // Resource: EventBridge Rule
    // ===================================================================

    const lambdaEventTarget = new Targets.LambdaFunction(checkKeysLambdaFunction);

    new EventBridge.Rule(this, 'CheckAccessKeysRule', {
      schedule: EventBridge.Schedule.cron({
        minute: '0',
        hour: '0',
        month: '*',
        weekDay: '*',
        year: '*',
      }),
      targets: [
        lambdaEventTarget
      ]
    })
  }
}
