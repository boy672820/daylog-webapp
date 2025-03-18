import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../../data/resource';
import { DataClient, SummaryItem, LoggerService } from '../types';

// 실제 Amplify 클라이언트는 복잡한 타입을 가지므로 any 타입 사용
// 단위 테스트에서는 이 인터페이스를 모킹하여 사용
export class AmplifyDataClientAdapter implements DataClient {
  constructor(
    private client: ReturnType<typeof generateClient<Schema>>,
    private logger: LoggerService
  ) {}

  async fetchSummariesByWeekId(weekId: string): Promise<SummaryItem[]> {
    try {
      const { data: allSummaries, errors } =
        await this.client.models.Summary.list({
          filter: {
            summaryId: {
              eq: weekId,
            },
          },
        });

      if (errors) {
        this.logger.error('Failed to fetch summaries', { weekId, errors });
        throw new Error('Failed to fetch summaries');
      }

      const summaryItems: SummaryItem[] = allSummaries.map(
        (summary: Schema['Summary']['type']) => ({
          userId: summary.userId,
          summaryId: summary.summaryId,
          startDate: summary.startDate,
          endDate: summary.endDate,
          review: summary.review,
        })
      );

      this.logger.info(
        `Retrieved ${summaryItems.length} summaries for week ${weekId}`
      );
      return summaryItems;
    } catch (error) {
      this.logger.error('Error fetching summaries', { error });
      throw error;
    }
  }
}
