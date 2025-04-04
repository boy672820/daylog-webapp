import { EventBridgeHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/daily-consumer';
import type { Schema } from '../../data/resource';

// 도메인, 포트, 어댑터 가져오기
import { WeekCalculator, DailyProcessor } from './domain';
import { ConsoleLogger, AmplifyRepository, MarkdownFormatter, DailyConsumerService } from './adapter';

// 설정 및 클라이언트 초기화
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

// 어댑터 초기화
const logger = new ConsoleLogger();
const client = generateClient<Schema>();
const repository = new AmplifyRepository(client, logger);
const formatter = new MarkdownFormatter();

// 도메인 서비스 초기화
const weekCalculator = new WeekCalculator();
const dailyProcessor = new DailyProcessor(
  weekCalculator,
  repository,
  formatter,
  logger
);

// 애플리케이션 서비스 초기화
const dailyConsumerService = new DailyConsumerService(dailyProcessor, logger);

// Lambda 핸들러
export const handler: EventBridgeHandler<'Scheduled Event', unknown, void> = async (event) => {
  try {
    await dailyConsumerService.processEvent(event);
  } catch (error) {
    logger.error('Unhandled error in handler', { error });
    throw error;
  }
};
