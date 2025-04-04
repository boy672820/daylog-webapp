// 이벤트 처리 서비스
import { DailyProcessor } from '../domain/daily-processor';
import { DailyEntry } from '../domain/types';
import { Logger } from '../port/logger';

export class DailyConsumerService {
  constructor(
    private dailyProcessor: DailyProcessor,
    private logger: Logger
  ) {}
  
  /**
   * EventBridge 이벤트 처리
   */
  async processEvent(event: {
    id: string;
    'detail-type'?: string;
    source?: string;
    detail: unknown;
  }): Promise<void> {
    this.logger.info('Event received', {
      id: event.id,
      detailType: event['detail-type'],
      source: event.source,
    });
    
    const payload = event.detail;
    
    if (!this.isValidPayload(payload)) {
      this.logger.error('Invalid payload', { payload });
      return;
    }
    
    await this.dailyProcessor.processDailyEntry(payload as DailyEntry);
    
    this.logger.info('Event processed', { id: event.id });
  }
  
  private isValidPayload(payload: unknown): boolean {
    if (!payload || typeof payload !== 'object') return false;
    
    return (
      'userId' in payload &&
      typeof payload.userId === 'string' &&
      'date' in payload &&
      typeof payload.date === 'string' &&
      'content' in payload &&
      typeof payload.content === 'string'
    );
  }
}