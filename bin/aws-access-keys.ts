#!/usr/bin/env node
import 'source-map-support/register';
import * as CDK from '@aws-cdk/core';
import { CheckKeysLambdaStack } from '../lib/check-keys-lambda-stack';
import { EventBridgeStack } from '../lib/event-bridge';

const app = new CDK.App();

const checkKeysLambdaStack = new CheckKeysLambdaStack(app, 'CheckKeysLambdaStack');

const eventBridgeStack = new EventBridgeStack(app, 'EventBridgeStack', {
  checkKeysLambdaFunction: checkKeysLambdaStack._CheckKeysLambdaFunction
});