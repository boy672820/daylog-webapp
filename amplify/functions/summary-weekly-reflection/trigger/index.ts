import { SQSEvent } from 'aws-lambda';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { Logger } from '@aws-lambda-powertools/logger';

const sfnClient = new SFNClient();
const stateMachineArn = process.env.STATE_MACHINE_ARN;

// Logger 초기화
const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'summary-weekly-reflection-trigger',
});

/**
 * SQS 이벤트를 받아 Step Functions 워크플로우를 시작하는 함수
 * 각 레코드마다 별도의 Step Functions 실행을 시작
 */
export const handler = async (event: SQSEvent) => {
  logger.info('Processing SQS event', {
    eventRecordsCount: event.Records.length,
  });

  if (!stateMachineArn) {
    logger.error('Missing environment variable');
    throw new Error('STATE_MACHINE_ARN environment variable is not set');
  }

  const executionPromises = event.Records.map(async (record) => {
    try {
      const eventBridgeEvent = JSON.parse(record.body);

      logger.debug('Parsed EventBridge event', {
        messageId: record.messageId,
        eventDetail: eventBridgeEvent.detail,
      });

      // Step Functions 실행 시작
      const startExecutionCommand = new StartExecutionCommand({
        stateMachineArn,
        input: JSON.stringify({
          detail: eventBridgeEvent.detail,
          messageId: record.messageId,
        }),
      });

      const response = await sfnClient.send(startExecutionCommand);
      logger.info('Started Step Functions execution', {
        messageId: record.messageId,
      });

      return {
        messageId: record.messageId,
        executionArn: response.executionArn,
        status: 'STARTED',
      };
    } catch (error) {
      logger.error('Error starting Step Functions execution', {
        messageId: record.messageId,
        error,
      });
      throw error;
    }
  });

  return Promise.all(executionPromises);
};
