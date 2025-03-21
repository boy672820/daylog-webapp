import { Logger } from '@aws-lambda-powertools/logger';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/summary-weekly-reflection';
import { Amplify } from 'aws-amplify';
import {
  SQSEvent,
  SQSRecord,
  SQSBatchResponse,
  SQSBatchItemFailure,
} from 'aws-lambda';
import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../data/resource';

/**
 * WeeklySummaryRequested 이벤트 세부 정보 타입 정의
 */
interface WeeklySummaryRequestedDetail {
  userId: string;
  summaryId: string;
  startDate: string;
  endDate: string;
}

/**
 * EventBridge 이벤트 타입 정의
 */
interface EventBridgeEvent {
  version: string;
  id: string;
  'detail-type': string;
  source: string;
  account: string;
  time: string;
  region: string;
  resources: string[];
  detail: WeeklySummaryRequestedDetail;
}

/**
 * SummaryContent 항목 타입 정의
 */
interface SummaryContentItem {
  userId: string;
  summaryId: string;
  date: string;
  content: string;
  createdDate?: string | null;
  updatedDate?: string | null;
}

/**
 * Summary 항목 타입 정의
 */
interface SummaryItem {
  userId: string;
  summaryId: string;
  startDate: string;
  endDate: string;
  review?: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
}

/**
 * 데이터 클라이언트 인터페이스
 */
interface DataClient {
  fetchSummaryContents(
    summaryId: string,
    userId: string
  ): Promise<SummaryContentItem[]>;
  fetchSummary(summaryId: string, userId: string): Promise<SummaryItem | null>;
  updateSummaryReview(
    summaryId: string,
    userId: string,
    review: string
  ): Promise<void>;
}

/**
 * Amplify 데이터 클라이언트 어댑터
 */
class AmplifyDataClientAdapter implements DataClient {
  constructor(
    private client: ReturnType<typeof generateClient<Schema>>,
    private logger: Logger
  ) {}

  /**
   * 특정 summaryId와 userId에 해당하는 Summary 항목 조회
   */
  async fetchSummary(
    summaryId: string,
    userId: string
  ): Promise<SummaryItem | null> {
    try {
      const { data: summary, errors } = await this.client.models.Summary.get({
        summaryId,
        userId,
      });

      if (errors) {
        this.logger.error('Failed to fetch Summary item', {
          summaryId,
          userId,
          errors,
        });
        throw new Error('Failed to fetch Summary item');
      }

      if (!summary) {
        this.logger.info('Summary item not found', { summaryId, userId });
        return null;
      }

      const summaryItem: SummaryItem = {
        userId: summary.userId,
        summaryId: summary.summaryId,
        startDate: summary.startDate,
        endDate: summary.endDate,
        review: summary.review,
        createdDate: summary.createdDate,
        updatedDate: summary.updatedDate,
      };
      return summaryItem;
    } catch (error) {
      this.logger.error('Error fetching Summary item', {
        summaryId,
        userId,
        error,
      });
      throw error;
    }
  }

  /**
   * 특정 summaryId와 userId에 해당하는 모든 SummaryContent 항목 조회
   */
  async fetchSummaryContents(
    summaryId: string,
    userId: string
  ): Promise<SummaryContentItem[]> {
    try {
      this.logger.info('Fetching SummaryContent items', { summaryId, userId });

      const { data: summaryContents, errors } =
        await this.client.models.SummaryContent.list({
          summaryId,
          userIdDate: {
            beginsWith: {
              userId,
              date: '',
            },
          },
        });

      if (errors) {
        this.logger.error('Failed to fetch SummaryContent items', {
          summaryId,
          userId,
          errors,
        });
        throw new Error('Failed to fetch SummaryContent items');
      }

      const contentItems: SummaryContentItem[] = summaryContents.map(
        (content: Schema['SummaryContent']['type']) => ({
          userId: content.userId,
          summaryId: content.summaryId,
          date: content.date,
          content: content.content || '',
          createdDate: content.createdDate,
          updatedDate: content.updatedDate,
        })
      );

      this.logger.info(
        `Retrieved ${contentItems.length} SummaryContent items`,
        { summaryId, userId }
      );
      return contentItems;
    } catch (error) {
      this.logger.error('Error fetching SummaryContent items', {
        summaryId,
        userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Summary 항목의 review 필드 업데이트
   */
  async updateSummaryReview(
    summaryId: string,
    userId: string,
    review: string
  ): Promise<void> {
    try {
      this.logger.info('Updating Summary review', { summaryId, userId });

      const { errors } = await this.client.models.Summary.update({
        summaryId,
        userId,
        review,
        updatedDate: new Date().toISOString(),
      });

      if (errors) {
        this.logger.error('Failed to update Summary review', {
          summaryId,
          userId,
          errors,
        });
        throw new Error('Failed to update Summary review');
      }

      this.logger.info('Successfully updated Summary review', {
        summaryId,
        userId,
      });
    } catch (error) {
      this.logger.error('Error updating Summary review', {
        summaryId,
        userId,
        error,
      });
      throw error;
    }
  }
}

const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'summary-weekly-reflection',
});

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  env
);
Amplify.configure(resourceConfig, libraryOptions);

// Amplify 클라이언트 생성
const client = generateClient<Schema>();
const dataClient = new AmplifyDataClientAdapter(client, logger);

/**
 * Lambda 핸들러 함수
 * WeeklySummaryRequested 이벤트를 받아 주간 회고 요약을 생성
 * 부분 배치 응답을 지원하여 실패한 메시지만 다시 큐로 보냄
 */
export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  logger.info('Processing WeeklySummaryRequested events:', {
    eventCount: event.Records.length,
  });

  // 실패한 메시지 ID를 추적하는 배열
  const batchItemFailures: SQSBatchItemFailure[] = [];

  // SQS 레코드를 순회하며 이벤트 처리
  for (const record of event.Records) {
    try {
      logger.info('Processing record', { messageId: record.messageId });
      const eventBridgeEvent = extractEventBridgeEvent(record);
      await processEvent(eventBridgeEvent);
      logger.info('Successfully processed record', {
        messageId: record.messageId,
      });
    } catch (error) {
      // 처리 실패 시 해당 메시지 ID를 실패 목록에 추가
      logger.error('Failed to process record', {
        messageId: record.messageId,
        error,
      });
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  // 부분 배치 응답 반환
  // 실패한 메시지는 다시 큐로 보내지고, 성공한 메시지는 삭제됨
  return {
    batchItemFailures,
  };
};

/**
 * 단일 이벤트 처리 함수
 * 타임아웃 처리를 포함하여 이벤트 처리
 */
async function processEvent(event: EventBridgeEvent): Promise<void> {
  logger.info('Processing WeeklySummaryRequested event:', {
    eventId: event.id,
    eventSource: event.source,
    eventTime: event.time,
  });

  try {
    // 이벤트 세부 정보 로깅
    const { userId, summaryId, startDate, endDate } = event.detail;

    logger.info('Processing weekly summary request with details:', {
      userId,
      summaryId,
      startDate,
      endDate,
    });

    // 이미 처리된 요약인지 확인
    const existingSummary = await dataClient.fetchSummary(summaryId, userId);

    if (existingSummary && existingSummary.review) {
      logger.info(
        'Summary already has a review, skipping AI summary generation',
        {
          summaryId,
          userId,
          reviewLength: existingSummary.review.length,
        }
      );
      return;
    }

    // SummaryContent 항목 조회
    const summaryContents = await dataClient.fetchSummaryContents(
      summaryId,
      userId
    );

    if (summaryContents.length === 0) {
      logger.warn(
        'No SummaryContent items found for the given summaryId and userId',
        {
          summaryId,
          userId,
        }
      );
      return;
    }

    logger.info(`Retrieved ${summaryContents.length} SummaryContent items`, {
      summaryId,
      userId,
    });

    // 회고 내용 추출
    const reflectionContents = summaryContents.map((item) => ({
      userId: item.userId,
      date: item.date,
      content: item.content,
    }));

    logger.info('Generating AI summary for weekly reflection:', {
      summaryId,
      userId,
    });

    // AI 요약 생성 (타임아웃 처리 포함)
    const aiSummary = await generateAISummary(reflectionContents);

    // 요약된 내용을 Summary 테이블에 업데이트
    await dataClient.updateSummaryReview(summaryId, userId, aiSummary);

    logger.info('Successfully generated and updated weekly summary', {
      summaryId,
      userId,
    });
  } catch (error) {
    logger.error('Error processing WeeklySummaryRequested event:', {
      eventId: event.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // 오류를 다시 던져서 핸들러에서 처리하도록 함
    throw error;
  }
}

/**
 * AI를 사용하여 회고 내용을 요약하는 함수
 * 타임아웃 처리를 포함하여 외부 API 호출 지연에 대응
 */
async function generateAISummary(
  reflectionContents: { userId: string; date: string; content: string }[]
): Promise<string> {
  // 타임아웃 시간 설정 (25초)
  const TIMEOUT_MS = 25000;

  // 타임아웃 Promise 생성
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('AI summary generation timed out after 25 seconds'));
    }, TIMEOUT_MS);
  });

  // 실제 AI 요약 생성 Promise
  const summaryPromise = async (): Promise<string> => {
    try {
      // 실제 OpenAI API 호출을 모의 구현 (1~60초 지연)
      const delay = Math.floor(Math.random() * (60000 - 1000 + 1)) + 1000;

      logger.info('Starting AI summary generation with simulated delay', {
        delay,
        contentCount: reflectionContents.length,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));

      // 실제 구현에서는 여기에 OpenAI API 호출 코드가 들어갈 예정
      // 현재는 간단한 요약 메시지 반환
      const contentCount = reflectionContents.length;
      const result = `userId: ${reflectionContents[0].userId}, 테스트 요약 메시지 (${contentCount}개의 일일 회고 기반)`;

      logger.info('Successfully generated AI summary', {
        delay,
        contentCount,
        resultLength: result.length,
      });

      return result;
    } catch (error) {
      logger.error('Error in AI summary generation', { error });
      throw error;
    }
  };

  // Promise.race를 사용하여 타임아웃 처리
  try {
    return await Promise.race([summaryPromise(), timeoutPromise]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      logger.warn('AI summary generation timed out, using fallback summary');
      throw new Error('AI summary generation timed out');
    }
    throw error;
  }
}

/**
 * SQS 레코드에서 EventBridge 이벤트 추출
 */
function extractEventBridgeEvent(record: SQSRecord): EventBridgeEvent {
  return JSON.parse(record.body);
}
