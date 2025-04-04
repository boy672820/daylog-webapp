// 도메인 타입 정의
export interface DailyEntry {
  userId: string;
  date: string;
  content: string;
}

export interface WeekSummary {
  userId: string;
  summaryId: string;
  review: string;
  startDate: string;
  endDate: string;
}

export interface DailyContent {
  userId: string;
  summaryId: string;
  date: string;
  content: string;
}

export interface WeekInfo {
  summaryId: string;
  startDate: Date;
  endDate: Date;
}