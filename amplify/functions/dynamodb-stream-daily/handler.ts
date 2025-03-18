import type { DynamoDBStreamHandler } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';

const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'dynamodb-stream-daily-handler',
});

const eventClient = new EventBridgeClient({});

export const handler: DynamoDBStreamHandler = async (event) => {
  for (const record of event.Records) {
    if ('MODIFY' !== record.eventName) {
      return { batchItemFailures: [] };
    }

    logger.info('Processing record', {
      eventID: record.eventID,
      eventName: record.eventName,
    });

    const result = await eventClient.send(
      new PutEventsCommand({
        Entries: [
          {
            Detail: JSON.stringify({
              userId: record.dynamodb?.NewImage?.userId.S,
              date: record.dynamodb?.NewImage?.date.S,
              content: record.dynamodb?.NewImage?.content.S,
            }),
            DetailType: 'DailyModified',
            EventBusName: 'default',
            Source: 'kr.co.daylog.services.dailies',
          },
        ],
      })
    );

    // 실패한 이벤트 처리
    if (result.FailedEntryCount && result.FailedEntryCount > 0) {
      logger.warn(`Failed to publish ${result.FailedEntryCount} events`, {
        failedEntries: result.Entries?.filter((entry) => entry.ErrorCode),
      });
    } else {
      logger.info(`Successfully published events to EventBridge`);
    }

    return { batchItemFailures: [] };
  }
};
