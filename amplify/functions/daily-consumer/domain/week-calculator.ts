// 주차 계산 로직
import { WeekInfo } from './types';
import { getISOWeek, getISOWeekYear } from 'date-fns';

export class WeekCalculator {
  /**
   * 주어진 날짜로부터 주 정보 계산
   */
  calculateWeekInfo(date: Date): WeekInfo {
    const isoYear = String(getISOWeekYear(date));
    const isoWeek = String(getISOWeek(date)).padStart(2, '0');
    const summaryId = `W#${isoYear}#${isoWeek}`;
    
    const startDate = this.calculateWeekStartDate(date);
    const endDate = this.calculateWeekEndDate(startDate);
    
    return {
      summaryId,
      startDate,
      endDate
    };
  }
  
  private calculateWeekStartDate(date: Date): Date {
    const startDate = new Date(date);
    const day = startDate.getDay();
    startDate.setDate(startDate.getDate() - (day === 0 ? 6 : day - 1));
    return startDate;
  }
  
  private calculateWeekEndDate(startDate: Date): Date {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    return endDate;
  }
}