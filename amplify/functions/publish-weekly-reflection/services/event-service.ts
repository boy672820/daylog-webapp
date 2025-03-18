import { SummaryItem, EventClient, LoggerService } from '../types';

export class EventService {
  constructor(
    private eventClient: EventClient,
    private logger: LoggerService
  ) {}

  /**
   * EventBridge에 이벤트 발행 함수
   * @param summaries Summary 목록
   * @param dateRange 날짜 범위
   */
  async publishEventsToEventBridge(
    summaries: SummaryItem[],
    dateRange: { startDate: string; endDate: string }
  ): Promise<void> {
    try {
      await this.eventClient.publishEvents(summaries, dateRange);
      this.logger.info('Events published successfully');
    } catch (error) {
      this.logger.error('Error in EventService.publishEventsToEventBridge', { error });
      throw error;
    }
  }
}