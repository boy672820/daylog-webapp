// Amplify 기반 저장소 구현
import { generateClient } from 'aws-amplify/data';
import { Schema } from '../../../data/resource';
import { SummaryRepository } from '../port/summary-repository';
import { WeekSummary, DailyContent } from '../domain/types';
import { Logger } from '../port/logger';

export class AmplifyRepository implements SummaryRepository {
  constructor(
    private client: ReturnType<typeof generateClient<Schema>>,
    private logger: Logger
  ) {}
  
  async findWeekSummary(userId: string, summaryId: string): Promise<WeekSummary | null> {
    try {
      const { data, errors } = await this.client.models.Summary.get({
        userId,
        summaryId,
      });
      
      if (errors) {
        this.logger.error('Failed to fetch summary', { userId, summaryId, errors });
        throw new Error('Failed to fetch summary');
      }
      
      return data ? {
        userId: data.userId,
        summaryId: data.summaryId,
        review: data.review || '',
        startDate: data.startDate,
        endDate: data.endDate
      } : null;
    } catch (error) {
      this.logger.error('Error fetching summary', { userId, summaryId, error });
      throw error;
    }
  }
  
  async createWeekSummary(summary: WeekSummary): Promise<void> {
    try {
      const { errors } = await this.client.models.Summary.create(summary);
      
      if (errors) {
        this.logger.error('Failed to create summary', { summary, errors });
        throw new Error('Failed to create summary');
      }
    } catch (error) {
      this.logger.error('Error creating summary', { summary, error });
      throw error;
    }
  }
  
  async findDailyContent(userId: string, summaryId: string, date: string): Promise<DailyContent | null> {
    try {
      const { data, errors } = await this.client.models.SummaryContent.get({
        userId,
        summaryId,
        date,
      });
      
      if (errors) {
        this.logger.error('Failed to fetch daily content', { userId, summaryId, date, errors });
        throw new Error('Failed to fetch daily content');
      }
      
      return data ? {
        userId: data.userId,
        summaryId: data.summaryId,
        date: data.date,
        content: data.content || ''
      } : null;
    } catch (error) {
      this.logger.error('Error fetching daily content', { userId, summaryId, date, error });
      throw error;
    }
  }
  
  async createDailyContent(content: DailyContent): Promise<void> {
    try {
      const { errors } = await this.client.models.SummaryContent.create(content);
      
      if (errors) {
        this.logger.error('Failed to create daily content', { content, errors });
        throw new Error('Failed to create daily content');
      }
    } catch (error) {
      this.logger.error('Error creating daily content', { content, error });
      throw error;
    }
  }
  
  async updateDailyContent(content: DailyContent): Promise<void> {
    try {
      const { errors } = await this.client.models.SummaryContent.update(content);
      
      if (errors) {
        this.logger.error('Failed to update daily content', { content, errors });
        throw new Error('Failed to update daily content');
      }
    } catch (error) {
      this.logger.error('Error updating daily content', { content, error });
      throw error;
    }
  }
}