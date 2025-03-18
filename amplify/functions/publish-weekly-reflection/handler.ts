import { EventBridgeHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/publish-weekly-reflection';
import type { Schema } from '../../data/resource';

import { DateService, SummaryService, EventService } from './services';
import { LoggerAdapter } from './utils/logger';
import { AmplifyDataClientAdapter } from './utils/amplify-client-adapter';
import { EventBridgeAdapter } from './utils/event-bridge-adapter';

// 설정 및 클라이언트 초기화
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  env
);
Amplify.configure(resourceConfig, libraryOptions);

// 로거 및 클라이언트 초기화
const logger = new LoggerAdapter();
const amplifyClient = generateClient<Schema>();
const dataClient = new AmplifyDataClientAdapter(amplifyClient, logger);
const eventClient = new EventBridgeAdapter(logger);

// 서비스 초기화
const dateService = new DateService();
const summaryService = new SummaryService(dataClient, logger);
const eventService = new EventService(eventClient, logger);

/**
 * Lambda 핸들러 함수
 * 모든 사용자의 일일회고를 주마다 취합하여 AI로 피드백하기 위해 EventBridge 이벤트를 발행
 */
export const handler: EventBridgeHandler<
  'Scheduled Event',
  null,
  void
> = async (event) => {
  try {
    logger.info('Starting weekly reflection publishing process', { event });

    // 이벤트 시간 파싱 (또는 현재 시간 사용)
    const eventTime = event.time ? new Date(event.time) : new Date();

    // 이전 주의 날짜 범위 및 주차 ID 계산
    const { weekId, startDate, endDate } =
      dateService.calculatePreviousWeekRange(eventTime);
    logger.info('Calculated previous week range', {
      weekId,
      startDate,
      endDate,
    });

    // 해당 주차의 모든 사용자 Summary 조회
    const summaries = await summaryService.fetchSummariesByWeekId(weekId);

    logger.debug('Fetched summaries for the week', {
      weekId,
      summaries,
    });

    // EventBridge에 이벤트 발행
    await eventService.publishEventsToEventBridge(summaries, {
      startDate,
      endDate,
    });

    logger.info('Weekly reflection publishing process completed successfully');
  } catch (error) {
    logger.error('Error in weekly reflection publishing process', { error });
    throw error;
  }
};
