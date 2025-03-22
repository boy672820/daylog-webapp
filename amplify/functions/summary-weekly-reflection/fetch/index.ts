import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { Logger } from '@aws-lambda-powertools/logger';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/summary-weekly-reflection-fetch';
import type { Schema } from '../../../data/resource';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  env
);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

// Logger 초기화
const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'summary-weekly-reflection-fetch',
});

interface SummaryContentItem {
  userId: string;
  summaryId: string;
  date: string;
  content: string;
  createdDate?: string | null;
  updatedDate?: string | null;
}

interface EventDetail {
  userId: string;
  summaryId: string;
  startDate: string;
  endDate: string;
}

interface StepFunctionsEvent {
  detail: EventDetail;
  messageId: string;
  summary: {
    userId: string;
    summaryId: string;
    startDate: string;
    endDate: string;
    review?: string | null;
    createdDate?: string | null;
    updatedDate?: string | null;
  } | null;
  isProcessed: boolean;
}

/**
 * SummaryContent 항목을 조회하는 함수
 * 특정 summaryId와 userId에 해당하는 모든 SummaryContent 항목 조회
 */
export const handler = async (event: StepFunctionsEvent) => {
  logger.info('Fetching SummaryContent items:', {
    event: event,
  });

  const { userId, summaryId } = event.detail;

  try {
    // SummaryContent 항목 조회
    const { data: summaryContentItems, errors } =
      await client.models.SummaryContent.list({
        summaryId,
        userIdDate: {
          beginsWith: {
            userId,
            date: '',
          },
        },
      });

    if (errors) {
      logger.error('Error fetching SummaryContent items', {
        errors,
        userId,
        summaryId,
      });
      throw new Error(
        `Failed to fetch SummaryContent items: ${errors
          .map((e) => e.message)
          .join(', ')}`
      );
    }

    // SummaryContent 항목 변환
    const contentItems: SummaryContentItem[] = summaryContentItems.map(
      (item) => ({
        userId: item.userId,
        summaryId: item.summaryId,
        date: item.date,
        content: item.content || '',
        createdDate: item.createdDate,
        updatedDate: item.updatedDate,
      })
    );

    logger.info(`Retrieved ${contentItems.length} SummaryContent items`, {
      summaryId,
      userId,
    });

    // 회고 내용 추출
    const reflectionContents = contentItems.map((item) => ({
      userId: item.userId,
      date: item.date,
      content: item.content,
    }));

    return {
      ...event,
      contentItems,
      reflectionContents,
    };
  } catch (error) {
    logger.error('Error fetching SummaryContent items:', {
      error,
      userId,
      summaryId,
    });
    throw error;
  }
};
