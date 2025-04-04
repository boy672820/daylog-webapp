// 요약 데이터 저장소 인터페이스
import { WeekSummary, DailyContent } from '../domain/types';

export interface SummaryRepository {
  findWeekSummary(userId: string, summaryId: string): Promise<WeekSummary | null>;
  createWeekSummary(summary: WeekSummary): Promise<void>;
  findDailyContent(userId: string, summaryId: string, date: string): Promise<DailyContent | null>;
  createDailyContent(content: DailyContent): Promise<void>;
  updateDailyContent(content: DailyContent): Promise<void>;
}