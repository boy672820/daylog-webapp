// 일일 회고 처리 핵심 로직
import { DailyEntry, WeekInfo } from './types';
import { WeekCalculator } from './week-calculator';
import { SummaryRepository } from '../port/summary-repository';
import { ContentFormatter } from '../port/content-formatter';
import { Logger } from '../port/logger';

export class DailyProcessor {
  constructor(
    private weekCalculator: WeekCalculator,
    private summaryRepository: SummaryRepository,
    private contentFormatter: ContentFormatter,
    private logger: Logger
  ) {}
  
  /**
   * 일일 회고 처리 핵심 로직
   */
  async processDailyEntry(entry: DailyEntry): Promise<void> {
    // 1. 날짜 정보 계산
    const date = new Date(entry.date);
    const weekInfo = this.weekCalculator.calculateWeekInfo(date);
    
    // 2. 주간 요약 조회 및 필요시 생성
    await this.ensureWeekSummaryExists(entry.userId, weekInfo);
    
    // 3. 일일 콘텐츠 처리
    const formattedContent = this.contentFormatter.format(entry.content);
    await this.processDailyContent(entry.userId, weekInfo.summaryId, entry.date, formattedContent);
  }
  
  private async ensureWeekSummaryExists(userId: string, weekInfo: WeekInfo): Promise<void> {
    const summary = await this.summaryRepository.findWeekSummary(userId, weekInfo.summaryId);
    
    if (!summary) {
      const startDateStr = this.formatDate(weekInfo.startDate);
      const endDateStr = this.formatDate(weekInfo.endDate);
      
      await this.summaryRepository.createWeekSummary({
        userId,
        summaryId: weekInfo.summaryId,
        review: '',
        startDate: startDateStr,
        endDate: endDateStr
      });
      
      this.logger.info('Created new week summary', {
        userId,
        summaryId: weekInfo.summaryId,
        startDate: startDateStr,
        endDate: endDateStr
      });
    }
  }
  
  private async processDailyContent(
    userId: string, 
    summaryId: string, 
    date: string, 
    content: string
  ): Promise<void> {
    const existingContent = await this.summaryRepository.findDailyContent(userId, summaryId, date);
    
    if (existingContent) {
      await this.summaryRepository.updateDailyContent({
        userId,
        summaryId,
        date,
        content
      });
      
      this.logger.info('Updated daily content', { userId, summaryId, date });
    } else {
      await this.summaryRepository.createDailyContent({
        userId,
        summaryId,
        date,
        content
      });
      
      this.logger.info('Created new daily content', { userId, summaryId, date });
    }
  }
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
  }
}