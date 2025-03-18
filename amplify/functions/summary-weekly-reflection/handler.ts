import { Logger } from '@aws-lambda-powertools/logger';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/summary-weekly-reflection';
import { Amplify } from 'aws-amplify';
import { SQSEvent, SQSRecord } from 'aws-lambda';
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
  fetchSummaryContents(summaryId: string, userId: string): Promise<SummaryContentItem[]>;
  fetchSummary(summaryId: string, userId: string): Promise<SummaryItem | null>;
  updateSummaryReview(summaryId: string, userId: string, review: string): Promise<void>;
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
  async fetchSummary(summaryId: string, userId: string): Promise<SummaryItem | null> {
    try {
      this.logger.info('Fetching Summary item', { summaryId, userId });
      
      const { data: summary, errors } = await this.client.models.Summary.get({
        summaryId,
        userId
      });

      if (errors) {
        this.logger.error('Failed to fetch Summary item', { summaryId, userId, errors });
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
        updatedDate: summary.updatedDate
      };

      this.logger.info('Successfully fetched Summary item', { summaryId, userId });
      return summaryItem;
    } catch (error) {
      this.logger.error('Error fetching Summary item', { summaryId, userId, error });
      throw error;
    }
  }

  /**
   * 특정 summaryId와 userId에 해당하는 모든 SummaryContent 항목 조회
   */
  async fetchSummaryContents(summaryId: string, userId: string): Promise<SummaryContentItem[]> {
    try {
      this.logger.info('Fetching SummaryContent items', { summaryId, userId });
      
      const { data: summaryContents, errors } = await this.client.models.SummaryContent.list({
        filter: {
          summaryId: { eq: summaryId },
          userId: { eq: userId }
        }
      });

      if (errors) {
        this.logger.error('Failed to fetch SummaryContent items', { summaryId, userId, errors });
        throw new Error('Failed to fetch SummaryContent items');
      }

      const contentItems: SummaryContentItem[] = summaryContents.map(
        (content: Schema['SummaryContent']['type']) => ({
          userId: content.userId,
          summaryId: content.summaryId,
          date: content.date,
          content: content.content || '',
          createdDate: content.createdDate,
          updatedDate: content.updatedDate
        })
      );

      this.logger.info(`Retrieved ${contentItems.length} SummaryContent items`, { summaryId, userId });
      return contentItems;
    } catch (error) {
      this.logger.error('Error fetching SummaryContent items', { summaryId, userId, error });
      throw error;
    }
  }

  /**
   * Summary 항목의 review 필드 업데이트
   */
  async updateSummaryReview(summaryId: string, userId: string, review: string): Promise<void> {
    try {
      this.logger.info('Updating Summary review', { summaryId, userId });
      
      const { errors } = await this.client.models.Summary.update({
        summaryId,
        userId,
        review,
        updatedDate: new Date().toISOString()
      });

      if (errors) {
        this.logger.error('Failed to update Summary review', { summaryId, userId, errors });
        throw new Error('Failed to update Summary review');
      }

      this.logger.info('Successfully updated Summary review', { summaryId, userId });
    } catch (error) {
      this.logger.error('Error updating Summary review', { summaryId, userId, error });
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
 */
export const handler = async (event: SQSEvent) => {
  logger.info('Processing WeeklySummaryRequested events:', {
    eventCount: event.Records.length,
  });

  // SQS 레코드를 순회하며 이벤트 처리
  for (const record of event.Records) {
    const eventBridgeEvent = extractEventBridgeEvent(record);
    await processEvent(eventBridgeEvent, dataClient);
  }
};

/**
 * 단일 이벤트 처리 함수
 */
async function processEvent(event: EventBridgeEvent, dataClient: DataClient): Promise<void> {
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
      logger.info('Summary already has a review, skipping AI summary generation', {
        summaryId,
        userId,
        reviewLength: existingSummary.review.length,
      });
      return;
    }

    // SummaryContent 항목 조회
    const summaryContents = await dataClient.fetchSummaryContents(summaryId, userId);
    
    if (summaryContents.length === 0) {
      logger.warn('No SummaryContent items found for the given summaryId and userId', {
        summaryId,
        userId,
      });
      return;
    }

    logger.info(`Retrieved ${summaryContents.length} SummaryContent items`, {
      summaryId,
      userId,
    });

    // 회고 내용 추출
    const reflectionContents = summaryContents.map(item => ({
      date: item.date,
      content: item.content
    }));

    // 여기서 AI를 사용하여 회고 내용을 요약하는 로직을 구현할 수 있습니다.
    // OpenAI API 키는 환경 변수로 설정되어 있습니다.
    const aiSummary = await generateAISummary(reflectionContents);

    // 요약된 내용을 Summary 테이블에 업데이트
    await dataClient.updateSummaryReview(summaryId, userId, aiSummary);

    logger.info('Successfully generated and updated weekly summary', {
      summaryId,
      userId,
    });
  } catch (error) {
    logger.error('Error processing WeeklySummaryRequested event:', { error });
    throw error;
  }
}

/**
 * AI를 사용하여 회고 내용을 요약하는 함수
 * 실제 OpenAI API 연동은 향후 구현 예정
 */
async function generateAISummary(reflectionContents: { date: string; content: string }[]): Promise<string> {
  // 현재는 간단한 요약 메시지 반환
  // 향후 OpenAI API를 사용하여 실제 요약 생성 구현 예정
  const delay = Math.floor(Math.random() * (60000 - 1000 + 1)) + 1000;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // reflectionContents 매개변수 사용 (ESLint 경고 해결)
  const contentCount = reflectionContents.length;
  
  return `테스트 요약 메시지 (${contentCount}개의 일일 회고 기반)`;
}

/**
 * SQS 레코드에서 EventBridge 이벤트 추출
 */
function extractEventBridgeEvent(record: SQSRecord): EventBridgeEvent {
  return JSON.parse(record.body);
}
