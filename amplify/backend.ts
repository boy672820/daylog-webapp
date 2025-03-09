import { defineBackend } from '@aws-amplify/backend';
import { Stack, aws_events } from 'aws-cdk-lib';
import { Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { StartingPosition, EventSourceMapping } from 'aws-cdk-lib/aws-lambda';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { dynamoDBStreamDaily } from './functions/dynamodb-stream-daily/resource';
import { Rule } from 'aws-cdk-lib/aws-events';
import { dailyConsumer } from './functions/daily-consumer/resource';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  dynamoDBStreamDaily,
  dailyConsumer,
});

const eventStack = backend.createStack('DaylogEventStack');

// Reference or create an EventBridge EventBus
const eventBus = aws_events.EventBus.fromEventBusName(
  eventStack,
  'DaylogEventBus',
  'default'
);
eventBus.grantPutEventsTo(backend.dynamoDBStreamDaily.resources.lambda);

backend.data.addEventBridgeDataSource('DaylogEventBridgeDataSource', eventBus);

new Rule(eventStack, 'DailyModifiedRule', {
  eventBus,
  eventPattern: {
    source: ['kr.co.daylog.services.dynamodb-stream-daily'],
    detailType: ['DailyModified'],
  },
}).addTarget(new LambdaFunction(backend.dailyConsumer.resources.lambda));


// Add a policy to the daily table stream
const dailyTable = backend.data.resources.tables['Daily'];
const dynamoDBStreamPolicy = new Policy(
  Stack.of(dailyTable),
  'DynamoDBStreamDailyStreamingPolicy',
  {
    statements: [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'dynamodb:DescribeStream',
          'dynamodb:GetRecords',
          'dynamodb:GetShardIterator',
          'dynamodb:ListStreams',
        ],
        resources: ['*'],
      }),
    ],
  }
);

backend.dynamoDBStreamDaily.resources.lambda.role?.attachInlinePolicy(
  dynamoDBStreamPolicy
);

const mapping = new EventSourceMapping(
  Stack.of(dailyTable),
  'DynamoDBStreamDailyEventStreamMapping',
  {
    target: backend.dynamoDBStreamDaily.resources.lambda,
    eventSourceArn: dailyTable.tableStreamArn,
    startingPosition: StartingPosition.LATEST,
  }
);

mapping.node.addDependency(dynamoDBStreamPolicy);
