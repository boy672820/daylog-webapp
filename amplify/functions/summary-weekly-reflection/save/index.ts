import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { Logger } from '@aws-lambda-powertools/logger';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/summary-weekly-reflection-save';
import type { Schema } from '../../../data/resource';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  env
);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

// Logger 초기화
const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'summary-weekly-reflection-save',
});

interface ReflectionContent {
  userId: string;
  date: string;
  content: string;
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
  contentItems: {
    userId: string;
    summaryId: string;
    date: string;
    content: string;
    createdDate?: string | null;
    updatedDate?: string | null;
  }[];
  reflectionContents: ReflectionContent[];
  aiSummary: string;
}

/**
 * 생성된 AI 요약을 DynamoDB에 저장하는 함수
 */
export const handler = async (event: StepFunctionsEvent) => {
  logger.info('Saving AI summary:', {
    event: event
  });

  const { userId, summaryId } = event.detail;
  const { aiSummary } = event;

  try {
    // Summary 테이블 업데이트
    const updatedDate = new Date().toISOString();
    const { data: updatedSummary, errors } = await client.models.Summary.update({
      userId,
      summaryId,
      review: aiSummary,
      updatedDate
    });

    if (errors) {
      logger.error('Error updating Summary', {
        errors,
        userId,
        summaryId
      });
      throw new Error(`Failed to update Summary: ${errors.map(e => e.message).join(', ')}`);
    }

    logger.info('Successfully updated Summary with AI review', {
      userId,
      summaryId,
      updatedItem: updatedSummary
    });

    return {
      ...event,
      result: {
        status: 'SUCCESS',
        message: 'AI summary saved successfully',
        updatedAt: updatedDate,
      },
    };
  } catch (error) {
    logger.error('Error saving AI summary:', {
      error,
      userId,
      summaryId
    });
    throw error;
  }
};