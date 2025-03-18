import { SummaryItem, DataClient, LoggerService } from '../types';

export class SummaryService {
  constructor(
    private dataClient: DataClient,
    private logger: LoggerService
  ) {}

  /**
   * 특정 주차의 모든 사용자 Summary 조회 함수
   * @param weekId 주차 ID (W#YYYY#WW 형식)
   * @returns 사용자별 Summary 목록
   */
  async fetchSummariesByWeekId(weekId: string): Promise<SummaryItem[]> {
    try {
      const summaries = await this.dataClient.fetchSummariesByWeekId(weekId);
      this.logger.info(`Retrieved ${summaries.length} summaries for week ${weekId}`);
      return summaries;
    } catch (error) {
      this.logger.error('Error in SummaryService.fetchSummariesByWeekId', { weekId, error });
      throw error;
    }
  }
}