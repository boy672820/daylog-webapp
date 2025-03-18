import { EventService } from '../../../amplify/functions/publish-weekly-reflection/services/event-service';
import { EventClient, LoggerService, SummaryItem } from '../../../amplify/functions/publish-weekly-reflection/types';

// 모킹된 EventClient 구현
class MockEventClient implements EventClient {
  public publishedEvents: {
    summaries: SummaryItem[];
    dateRange: { startDate: string; endDate: string };
  }[] = [];
  private shouldThrowError = false;

  constructor(shouldThrowError = false) {
    this.shouldThrowError = shouldThrowError;
  }

  async publishEvents(
    summaries: SummaryItem[],
    dateRange: { startDate: string; endDate: string }
  ): Promise<void> {
    if (this.shouldThrowError) {
      throw new Error('Mock event publishing error');
    }
    this.publishedEvents.push({ summaries, dateRange });
  }
}

// 모킹된 Logger 구현
class MockLogger implements LoggerService {
  public logs: Array<{ level: string; message: string; context?: Record<string, unknown> }> = [];

  info(message: string, context?: Record<string, unknown>): void {
    this.logs.push({ level: 'info', message, context });
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.logs.push({ level: 'error', message, context });
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logs.push({ level: 'warn', message, context });
  }
}

describe('EventService', () => {
  let mockLogger: MockLogger;
  let mockEventClient: MockEventClient;
  let eventService: EventService;

  beforeEach(() => {
    mockLogger = new MockLogger();
    mockEventClient = new MockEventClient();
    eventService = new EventService(mockEventClient, mockLogger);
  });

  describe('publishEventsToEventBridge', () => {
    test('Summary 목록이 있을 때 EventBridge에 이벤트를 올바르게 발행해야 함', async () => {
      // 테스트 데이터 설정
      const summaries: SummaryItem[] = [
        {
          userId: 'user1',
          summaryId: 'W#2025#11',
          startDate: '2025-03-10',
          endDate: '2025-03-16',
          review: null,
        },
        {
          userId: 'user2',
          summaryId: 'W#2025#11',
          startDate: '2025-03-10',
          endDate: '2025-03-16',
          review: null,
        },
      ];
      const dateRange = { startDate: '2025-03-10', endDate: '2025-03-16' };

      // 함수 호출
      await eventService.publishEventsToEventBridge(summaries, dateRange);

      // 결과 검증
      expect(mockEventClient.publishedEvents.length).toBe(1);
      expect(mockEventClient.publishedEvents[0].summaries).toEqual(summaries);
      expect(mockEventClient.publishedEvents[0].dateRange).toEqual(dateRange);
      expect(mockLogger.logs.length).toBe(1);
      expect(mockLogger.logs[0].level).toBe('info');
      expect(mockLogger.logs[0].message).toBe('Events published successfully');
    });

    test('빈 Summary 목록도 올바르게 처리해야 함', async () => {
      // 빈 목록으로 설정
      const summaries: SummaryItem[] = [];
      const dateRange = { startDate: '2025-03-10', endDate: '2025-03-16' };

      // 함수 호출
      await eventService.publishEventsToEventBridge(summaries, dateRange);

      // 결과 검증
      expect(mockEventClient.publishedEvents.length).toBe(1);
      expect(mockEventClient.publishedEvents[0].summaries).toEqual([]);
      expect(mockLogger.logs.length).toBe(1);
      expect(mockLogger.logs[0].level).toBe('info');
    });

    test('오류가 발생하면 적절히 처리해야 함', async () => {
      // 오류를 발생시키도록 설정
      mockEventClient = new MockEventClient(true);
      eventService = new EventService(mockEventClient, mockLogger);

      const summaries: SummaryItem[] = [
        {
          userId: 'user1',
          summaryId: 'W#2025#11',
          startDate: '2025-03-10',
          endDate: '2025-03-16',
          review: null,
        },
      ];
      const dateRange = { startDate: '2025-03-10', endDate: '2025-03-16' };

      // 함수 호출 및 오류 검증
      await expect(eventService.publishEventsToEventBridge(summaries, dateRange)).rejects.toThrow(
        'Mock event publishing error'
      );
      expect(mockLogger.logs.length).toBe(1);
      expect(mockLogger.logs[0].level).toBe('error');
      expect(mockLogger.logs[0].message).toContain('Error in EventService');
    });
  });
});