import { SummaryService } from '../../../amplify/functions/publish-weekly-reflection/services/summary-service';
import { DataClient, LoggerService, SummaryItem } from '../../../amplify/functions/publish-weekly-reflection/types';

// 모킹된 DataClient 구현
class MockDataClient implements DataClient {
  private mockSummaries: SummaryItem[] = [];
  private shouldThrowError = false;

  constructor(mockSummaries: SummaryItem[] = [], shouldThrowError = false) {
    this.mockSummaries = mockSummaries;
    this.shouldThrowError = shouldThrowError;
  }

  async fetchSummariesByWeekId(): Promise<SummaryItem[]> {
    if (this.shouldThrowError) {
      throw new Error('Mock error');
    }
    return this.mockSummaries;
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

describe('SummaryService', () => {
  let mockLogger: MockLogger;
  let mockDataClient: MockDataClient;
  let summaryService: SummaryService;

  beforeEach(() => {
    mockLogger = new MockLogger();
  });

  describe('fetchSummariesByWeekId', () => {
    test('주차 ID로 Summary 목록을 올바르게 조회해야 함', async () => {
      // 모킹된 데이터 설정
      const mockSummaries: SummaryItem[] = [
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

      mockDataClient = new MockDataClient(mockSummaries);
      summaryService = new SummaryService(mockDataClient, mockLogger);

      // 함수 호출
      const result = await summaryService.fetchSummariesByWeekId('W#2025#11');

      // 결과 검증
      expect(result).toEqual(mockSummaries);
      expect(result.length).toBe(2);
      expect(mockLogger.logs.length).toBe(1);
      expect(mockLogger.logs[0].level).toBe('info');
      expect(mockLogger.logs[0].message).toContain('Retrieved 2 summaries');
    });

    test('빈 Summary 목록을 올바르게 처리해야 함', async () => {
      // 빈 목록으로 설정
      mockDataClient = new MockDataClient([]);
      summaryService = new SummaryService(mockDataClient, mockLogger);

      // 함수 호출
      const result = await summaryService.fetchSummariesByWeekId('W#2025#11');

      // 결과 검증
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
      expect(mockLogger.logs.length).toBe(1);
      expect(mockLogger.logs[0].level).toBe('info');
      expect(mockLogger.logs[0].message).toContain('Retrieved 0 summaries');
    });

    test('오류가 발생하면 적절히 처리해야 함', async () => {
      // 오류를 발생시키도록 설정
      mockDataClient = new MockDataClient([], true);
      summaryService = new SummaryService(mockDataClient, mockLogger);

      // 함수 호출 및 오류 검증
      await expect(summaryService.fetchSummariesByWeekId('W#2025#11')).rejects.toThrow('Mock error');
      expect(mockLogger.logs.length).toBe(1);
      expect(mockLogger.logs[0].level).toBe('error');
      expect(mockLogger.logs[0].message).toContain('Error in SummaryService');
    });
  });
});