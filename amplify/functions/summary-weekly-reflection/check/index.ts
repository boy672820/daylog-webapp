import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { Logger } from '@aws-lambda-powertools/logger';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/summary-weekly-reflection-check';
import type { Schema } from '../../../data/resource';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  env
);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

// Logger 초기화
const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'summary-weekly-reflection-check',
});

/**
 * Summary가 이미 처리되었는지 확인하는 함수
 * 1. review 필드가 있으면 이미 처리된 것으로 간주
 * 2. 이벤트의 날짜 범위와 Summary의 날짜 범위가 일치하는지 확인
 */
interface EventDetail {
  userId: string;
  summaryId: string;
  startDate: string;
  endDate: string;
}

interface StepFunctionsEvent {
  detail: EventDetail;
  messageId: string;
}

export const handler = async (event: StepFunctionsEvent) => {
  logger.info('Checking if summary is already processed:', {
    event: event,
  });

  const { userId, summaryId } = event.detail;

  try {
    // Summary 항목 조회
    const { data: summary, errors } = await client.models.Summary.get({
      userId,
      summaryId,
    });

    if (errors) {
      logger.error('Error fetching summary', {
        errors,
        userId,
        summaryId,
      });
      throw new Error(
        `Failed to fetch summary: ${errors.map((e) => e.message).join(', ')}`
      );
    }

    // 이미 review가 있는지 확인
    const isProcessed = summary && summary.review;

    logger.info('Summary check result:', {
      userId,
      summaryId,
      isProcessed: !!isProcessed,
      hasReview: isProcessed ? 'yes' : 'no',
    });

    return {
      ...event,
      isProcessed: !!isProcessed,
      summary: summary || null,
    };
  } catch (error) {
    logger.error('Error checking summary:', {
      error,
      userId,
      summaryId,
    });
    throw error;
  }
};
