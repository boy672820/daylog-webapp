export interface DateRange {
  weekId: string;
  startDate: string;
  endDate: string;
}

export interface SummaryItem {
  userId: string;
  summaryId: string;
  startDate: string;
  endDate: string;
}

export interface EventDetail {
  userId: string;
  summaryId: string;
  startDate: string;
  endDate: string;
}

export interface DataClient {
  fetchSummariesByWeekId(weekId: string): Promise<SummaryItem[]>;
}

export interface EventClient {
  publishEvents(
    summaries: SummaryItem[],
    dateRange: Pick<DateRange, 'startDate' | 'endDate'>
  ): Promise<void>;
}

export interface LoggerService {
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
}
