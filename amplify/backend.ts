import { defineBackend } from '@aws-amplify/backend';
import { Duration, Stack } from 'aws-cdk-lib';
import { Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { StartingPosition, EventSourceMapping } from 'aws-cdk-lib/aws-lambda';
import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { dynamoDBStreamDaily } from './functions/dynamodb-stream-daily/resource';
import { dailyConsumer } from './functions/daily-consumer/resource';
import { publishWeeklyReflection } from './functions/publish-weekly-reflection/resource';
import { LambdaFunction, SqsQueue } from 'aws-cdk-lib/aws-events-targets';
import { summaryWeeklyReflection } from './functions/summary-weekly-reflection/resource';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  dynamoDBStreamDaily,
  dailyConsumer,
  publishWeeklyReflection,
  summaryWeeklyReflection,
});

const weeklySummaryRequestQueue = new Queue(
  backend.stack,
  'WeeklySummaryRequestQueue',
  {
    visibilityTimeout: Duration.seconds(300), // 5분, Lambda 함수 타임아웃보다 길게 설정
  }
);

backend.summaryWeeklyReflection.resources.lambda.addEventSource(
  new SqsEventSource(weeklySummaryRequestQueue, {
    batchSize: 10,
    maxBatchingWindow: Duration.seconds(30),
  })
);

const eventStack = backend.createStack('DaylogEventStack');

// Reference or create an EventBridge EventBus
const eventBus = EventBus.fromEventBusName(
  eventStack,
  'DaylogEventBus',
  'default'
);
eventBus.grantPutEventsTo(backend.dynamoDBStreamDaily.resources.lambda);
eventBus.grantPutEventsTo(backend.publishWeeklyReflection.resources.lambda);

backend.data.addEventBridgeDataSource('DaylogEventBridgeDataSource', eventBus);

new Rule(eventStack, 'DailyModifiedRule', {
  eventBus,
  eventPattern: {
    source: ['kr.co.daylog.services.dailies'],
    detailType: ['DailyModified'],
  },
}).addTarget(new LambdaFunction(backend.dailyConsumer.resources.lambda));

new Rule(eventStack, 'WeeklySummaryRequestedRule', {
  eventBus,
  eventPattern: {
    source: ['kr.co.daylog.services.weeklysummary'],
    detailType: ['WeeklySummaryRequested'],
  },
}).addTarget(new SqsQueue(weeklySummaryRequestQueue));

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
