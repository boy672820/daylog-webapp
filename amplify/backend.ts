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
import {
  summaryWeeklyReflectionCheck,
  summaryWeeklyReflectionFetch,
  summaryWeeklyReflectionGenerateWithAi,
  summaryWeeklyReflectionSave,
} from './functions/summary-weekly-reflection/resource';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Alarm } from 'aws-cdk-lib/aws-cloudwatch';
import { WeeklySummaryStateMachine } from './functions/summary-weekly-reflection/resources';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  dynamoDBStreamDaily,
  dailyConsumer,
  publishWeeklyReflection,
  summaryWeeklyReflectionCheck,
  summaryWeeklyReflectionFetch,
  summaryWeeklyReflectionGenerateWithAi,
  summaryWeeklyReflectionSave,
});

const dlq = new Queue(backend.stack, 'WeeklySummaryDLQ', {
  retentionPeriod: Duration.days(14),
});

const weeklySummaryRequestQueue = new Queue(
  backend.stack,
  'WeeklySummaryRequestQueue',
  {
    visibilityTimeout: Duration.seconds(45), // 45초, Lambda 함수 타임아웃보다 길게 설정
    deadLetterQueue: {
      queue: dlq,
      maxReceiveCount: 3,
    },
  }
);

// CloudWatch 알람 설정
new Alarm(backend.stack, 'DLQMessagesAlarm', {
  metric: dlq.metricApproximateNumberOfMessagesVisible(),
  threshold: 1,
  evaluationPeriods: 1,
});

// Step Functions 상태 머신 생성
const weeklySummaryStateMachine = new WeeklySummaryStateMachine(
  backend.stack,
  'WeeklySummaryStateMachine',
  {
    checkFunction: backend.summaryWeeklyReflectionCheck.resources.lambda,
    fetchFunction: backend.summaryWeeklyReflectionFetch.resources.lambda,
    generateWithAiFunction:
      backend.summaryWeeklyReflectionGenerateWithAi.resources.lambda,
    saveFunction: backend.summaryWeeklyReflectionSave.resources.lambda,
  }
);

// Step Functions 상태 머신에 대한 CloudWatch 알람 설정
new Alarm(backend.stack, 'StepFunctionsExecutionFailedAlarm', {
  metric: weeklySummaryStateMachine.stateMachine.metricFailed(),
  threshold: 1,
  evaluationPeriods: 1,
});

weeklySummaryStateMachine.triggerLambda.addEventSource(
  new SqsEventSource(weeklySummaryRequestQueue, {
    batchSize: 10,
    maxBatchingWindow: Duration.seconds(30),
    reportBatchItemFailures: true,
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
