import { DateService } from '../../../amplify/functions/publish-weekly-reflection/services/date-service';

describe('DateService', () => {
  let dateService: DateService;

  beforeEach(() => {
    dateService = new DateService();
  });

  describe('calculatePreviousWeekRange', () => {
    test('이전 주의 날짜 범위를 올바르게 계산해야 함', () => {
      // 2025-03-17 (월요일)을 기준으로 이전 주 계산
      const currentDate = new Date('2025-03-17T00:00:00Z');
      const result = dateService.calculatePreviousWeekRange(currentDate);

      // 이전 주는 2025-03-10 ~ 2025-03-16
      expect(result.weekId).toBe('W#2025#11'); // 2025년 11주차
      expect(result.startDate).toBe('2025-03-10');
      expect(result.endDate).toBe('2025-03-16');
    });

    test('일요일을 기준으로 이전 주의 날짜 범위를 올바르게 계산해야 함', () => {
      // 2025-03-16 (일요일)을 기준으로 이전 주 계산
      const currentDate = new Date('2025-03-16T00:00:00Z');
      const result = dateService.calculatePreviousWeekRange(currentDate);

      // 이전 주는 2025-03-03 ~ 2025-03-09
      expect(result.weekId).toBe('W#2025#10'); // 2025년 10주차
      expect(result.startDate).toBe('2025-03-03');
      expect(result.endDate).toBe('2025-03-09');
    });

    test('연도가 바뀌는 경우 주차 ID를 올바르게 계산해야 함', () => {
      // 2025-01-01 (수요일)을 기준으로 이전 주 계산
      const currentDate = new Date('2025-01-01T00:00:00Z');
      const result = dateService.calculatePreviousWeekRange(currentDate);

      // 이전 주는 2024-12-23 ~ 2024-12-29
      expect(result.weekId).toBe('W#2024#52'); // 2024년 52주차
      expect(result.startDate).toBe('2024-12-23');
      expect(result.endDate).toBe('2024-12-29');
    });
  });
});