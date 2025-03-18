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

      // EventBridge에 이벤트 발행
      const command = new PutEventsCommand({
        Entries: entries,
      });

      const result = await this.eventBridgeClient.send(command);

      // 실패한 이벤트 처리
      if (result.FailedEntryCount && result.FailedEntryCount > 0) {
        this.logger.warn(
          `Failed to publish ${result.FailedEntryCount} events`,
          {
            failedEntries: result.Entries?.filter((entry) => entry.ErrorCode),
          }
        );
      } else {
        this.logger.info(
          `Successfully published ${entries.length} events to EventBridge`
        );
      }
    } catch (error) {
      this.logger.error('Error publishing events to EventBridge', { error });
      throw error;
    }
  }
}
