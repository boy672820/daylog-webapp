import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import { EventClient, SummaryItem, LoggerService } from '../types';

export class EventBridgeAdapter implements EventClient {
  private eventBridgeClient: EventBridgeClient;

  constructor(
    private logger: LoggerService,
    region: string = process.env.AWS_REGION || 'us-east-1',
    private eventBusName: string = process.env.EVENT_BUS_NAME || 'default'
  ) {
    this.eventBridgeClient = new EventBridgeClient({ region });
  }

  /**
   * 배열을 지정된 크기의 청크로 분할하는 유틸리티 함수
   * @param array 분할할 배열
   * @param chunkSize 청크 크기
   * @returns 청크 배열의 배열
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  async publishEvents(
    summaries: SummaryItem[],
    dateRange: { startDate: string; endDate: string }
  ): Promise<void> {
    if (summaries.length === 0) {
      this.logger.info('No summaries to process, skipping event publishing');
      return;
    }

    try {
      // 각 Summary에 대한 이벤트 항목 생성
      const entries = summaries.map((summary) => ({
        EventBusName: this.eventBusName,
        Source: 'kr.co.daylog.services.weeklysummary',
        DetailType: 'WeeklySummaryRequested',
        Detail: JSON.stringify({
          userId: summary.userId,
          summaryId: summary.summaryId,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }),
      }));

      // EventBridge PutEvents API는 한 번에 최대 10개의 이벤트만 허용
      // 10개씩 청크로 나누어 처리
      const MAX_EVENTS_PER_BATCH = 10;
      const entryChunks = this.chunkArray(entries, MAX_EVENTS_PER_BATCH);
      
      this.logger.info(`Splitting ${entries.length} events into ${entryChunks.length} batches`);
      
      let totalSuccessCount = 0;
      let totalFailedCount = 0;
      const failedEntries: Array<{ ErrorCode?: string; ErrorMessage?: string }> = [];

      // 각 청크별로 이벤트 발행
      for (let i = 0; i < entryChunks.length; i++) {
        const chunk = entryChunks[i];
        this.logger.debug(`Processing batch ${i + 1}/${entryChunks.length} with ${chunk.length} events`);
        
        const command = new PutEventsCommand({
          Entries: chunk,
        });

        const result = await this.eventBridgeClient.send(command);

        // 실패한 이벤트 처리
        if (result.FailedEntryCount && result.FailedEntryCount > 0) {
          totalFailedCount += result.FailedEntryCount;
          
          const batchFailedEntries = result.Entries?.filter((entry) => entry.ErrorCode);
          if (batchFailedEntries && batchFailedEntries.length > 0) {
            failedEntries.push(...batchFailedEntries);
          }
          
          this.logger.warn(
            `Batch ${i + 1}/${entryChunks.length}: Failed to publish ${result.FailedEntryCount} events`,
            { batchFailedEntries }
          );
        }
        
        // 성공한 이벤트 수 계산
        const successCount = chunk.length - (result.FailedEntryCount || 0);
        totalSuccessCount += successCount;
        
        this.logger.debug(
          `Batch ${i + 1}/${entryChunks.length}: Successfully published ${successCount} events`
        );
      }

      // 전체 결과 로깅
      if (totalFailedCount > 0) {
        this.logger.warn(
          `Completed with ${totalFailedCount} failed events out of ${entries.length} total events`,
          { failedEntries }
        );
      } else {
        this.logger.info(
          `Successfully published all ${totalSuccessCount} events to EventBridge`
        );
      }
    } catch (error) {
      this.logger.error('Error publishing events to EventBridge', { error });
      throw error;
    }
  }
}
