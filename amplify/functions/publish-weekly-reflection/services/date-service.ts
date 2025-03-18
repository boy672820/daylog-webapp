import { format, getISOWeek, getISOWeekYear, subWeeks } from 'date-fns';
import { DateRange } from '../types';

export class DateService {
  /**
   * 이전 주의 날짜 범위 계산 함수
   * @param date 기준 날짜
   * @returns 이전 주의 시작일과 종료일
   */
  calculatePreviousWeekRange(date: Date): DateRange {
    // 1주 전 날짜 계산
    const previousWeekDate = subWeeks(date, 1);
    
    // ISO 주차 및 연도 계산
    const isoYear = getISOWeekYear(previousWeekDate);
    const isoWeek = getISOWeek(previousWeekDate);
    
    // 주차 ID 생성 (W#YYYY#WW 형식)
    const weekId = `W#${isoYear}#${String(isoWeek).padStart(2, '0')}`;
    
    // 해당 주의 시작일 계산 (월요일)
    const startDate = new Date(previousWeekDate);
    const day = startDate.getDay();
    startDate.setDate(startDate.getDate() - (day === 0 ? 6 : day - 1));
    
    // 해당 주의 종료일 계산 (일요일)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    return {
      weekId,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    };
  }
}