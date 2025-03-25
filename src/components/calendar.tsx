'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LockIcon,
  Loader2,
  BookOpen,
  FileText,
  X,
} from 'lucide-react';
import { DayPicker, DayProps } from 'react-day-picker';
import {
  format,
  isToday,
  isFuture,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn, formatDate } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../amplify/data/resource';
import { useAuthSession } from '../hooks/use-auth-session';

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  initialMonth: Date;
};

const client = generateClient<Schema>({
  authMode: 'userPool',
});

// 날짜가 특정 주에 속하는지 확인하는 함수
const isDateInWeek = (
  date: Date,
  weekStartDate: Date,
  weekEndDate: Date
): boolean => {
  const dateStr = formatDate(date);
  const startStr = formatDate(weekStartDate);
  const endStr = formatDate(weekEndDate);
  return dateStr >= startStr && dateStr <= endStr;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  initialMonth,
  ...props
}: CalendarProps) {
  const [navigatingDate, setNavigatingDate] = useState<string | null>(null);
  const [month, setMonth] = useState<Date>(initialMonth);
  const [writtenDates, setWrittenDates] = useState<Set<string>>(new Set());
  const [weeklyReflections, setWeeklyReflections] = useState<
    Array<{
      summaryId: string;
      startDate: Date;
      endDate: Date;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWeeklySummary, setSelectedWeeklySummary] = useState<{
    summaryId: string;
    startDate: Date;
    endDate: Date;
    review?: string | null;
  } | null>(null);
  const [isWeeklySummaryDialogOpen, setIsWeeklySummaryDialogOpen] =
    useState(false);

  const router = useRouter();
  const { currentUser } = useAuthSession();

  // 날짜 범위에 따른 데이터 조회
  const getDailies = useCallback(
    async (date: Date = new Date()) => {
      if (!currentUser.isInitialized || !currentUser.userId) {
        return;
      }

      setIsLoading(true);

      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

      try {
        const { data: dailies } =
          await client.models.Daily.listDailyByUserIdAndDate({
            userId: currentUser.userId,
            date: {
              between: [formatDate(calendarStart), formatDate(calendarEnd)],
            },
          });

        const dateSet = dailies.reduce<Set<string>>((acc, daily) => {
          if (daily?.date && daily?.content) {
            acc.add(daily.date);
          }
          return acc;
        }, new Set());

        setWrittenDates(dateSet);
      } catch (error) {
        console.error('Failed to fetch dailies:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser.isInitialized, currentUser.userId]
  );

  // 주간 회고록 데이터 조회
  const getWeeklySummaries = useCallback(
    async (date: Date = new Date()) => {
      if (!currentUser.isInitialized || !currentUser.userId) {
        return;
      }

      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

      try {
        // Summary 모델에서 날짜 범위에 해당하는 주간 회고록 조회
        const { data: summaries } =
          await client.models.Summary.listSummaryByUserIdAndStartDate(
            {
              userId: currentUser.userId,
              startDate: {
                between: [formatDate(calendarStart), formatDate(calendarEnd)],
              },
            },
            {
              authMode: 'apiKey',
            }
          );

        // 주간 회고록 데이터 변환
        const reflections = summaries
          .filter((summary) => summary.review)
          .map((summary) => ({
            summaryId: summary.summaryId,
            startDate: new Date(summary.startDate),
            endDate: new Date(summary.endDate),
            review: summary.review,
          }));

        setWeeklyReflections(reflections);
      } catch (error) {
        console.error('Failed to fetch weekly summaries:', error);
      }
    },
    [currentUser.isInitialized, currentUser.userId]
  );

  // 초기 데이터 로드
  useEffect(() => {
    getDailies(month);
    getWeeklySummaries(month);
  }, [getDailies, getWeeklySummaries, month]);

  // 월 변경 핸들러
  const handleMonthChange = (date: Date) => {
    setMonth(date);
    getDailies(date);
    getWeeklySummaries(date);
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (dateString: string) => {
    setNavigatingDate(dateString);
    router.push(`/daily?date=${dateString}`);
  };

  // 주간 회고록 클릭 핸들러
  const handleWeeklySummaryClick = (summary: {
    summaryId: string;
    startDate: Date;
    endDate: Date;
    review?: string | null;
  }) => {
    setSelectedWeeklySummary(summary);
    setIsWeeklySummaryDialogOpen(true);
  };

  const currentHour = new Date().getHours();

  return (
    <div className='space-y-4 w-full'>
      {isLoading ? (
        <div className='h-[500px] w-full flex items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
        </div>
      ) : (
        <>
          <DayPicker
            month={month}
            onMonthChange={handleMonthChange}
            locale={ko}
            showOutsideDays={showOutsideDays}
            className={cn('p-3', className)}
            classNames={{
              months:
                'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
              month: 'space-y-4',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-sm font-medium',
              nav: 'space-x-1 flex items-center',
              nav_button: cn(
                buttonVariants({ variant: 'outline' }),
                'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
              ),
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell:
                'text-muted-foreground w-32 py-2.5 font-normal text-xs',
              row: 'flex w-full',
              cell: 'p-0',
              day_range_end: 'day-range-end',
              day_selected:
                'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
              day_outside:
                'day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground',
              day_disabled: 'text-muted-foreground opacity-50',
              day_range_middle:
                'aria-selected:bg-accent aria-selected:text-accent-foreground',
              day_hidden: 'invisible',
              ...classNames,
            }}
            components={{
              Day: (dayProps) => (
                <Day
                  {...dayProps}
                  navigatingDate={navigatingDate}
                  currentHour={currentHour}
                  writtenDates={writtenDates}
                  weeklyReflections={weeklyReflections}
                  onDateClick={handleDateClick}
                  onWeeklySummaryClick={handleWeeklySummaryClick}
                />
              ),
              IconLeft: () => <ChevronLeft className='h-4 w-4' />,
              IconRight: () => <ChevronRight className='h-4 w-4' />,
            }}
            {...props}
          />

          {/* 주간 회고록 모달 */}
          <Dialog
            open={isWeeklySummaryDialogOpen}
            onOpenChange={setIsWeeklySummaryDialogOpen}
          >
            <DialogContent className='sm:max-w-[650px] max-h-[80vh] overflow-y-auto bg-neutral-900 border-green-500/30'>
              <DialogHeader className='border-b border-green-500/20 pb-4'>
                <div className='flex items-center'>
                  <FileText className='h-6 w-6 text-green-400 mr-2' />
                  <DialogTitle className='text-xl font-semibold text-green-400'>
                    주간 회고록
                  </DialogTitle>
                </div>
                <DialogDescription className='mt-2'>
                  {selectedWeeklySummary && (
                    <div className='flex flex-col space-y-1'>
                      <span className='text-sm font-medium text-green-300/90'>
                        {format(
                          selectedWeeklySummary.startDate,
                          'yyyy년 MM월 dd일',
                          { locale: ko }
                        )}{' '}
                        ~
                        {format(
                          selectedWeeklySummary.endDate,
                          'yyyy년 MM월 dd일',
                          { locale: ko }
                        )}
                      </span>
                      <span className='text-xs text-neutral-400'>
                        이 기간 동안의 일일 회고를 바탕으로 AI가 생성한 주간
                        요약입니다.
                      </span>
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className='mt-6 whitespace-pre-wrap text-neutral-100 bg-neutral-800 p-5 rounded-md border border-green-500/20 shadow-inner shadow-green-900/10'>
                {selectedWeeklySummary?.review ||
                  '주간 회고록 내용이 없습니다.'}
              </div>
              <div className='mt-4 text-xs text-neutral-400 flex items-center'>
                <span className='bg-green-800/30 text-green-300 text-xs px-2 py-1 rounded-full mr-2'>
                  AI 생성
                </span>
                <span>이 주간 회고록은 AI에 의해 자동으로 생성되었습니다.</span>
              </div>
              <DialogClose className='absolute right-4 top-4 hover:bg-neutral-800 p-1 rounded-full transition-colors'>
                <X className='h-4 w-4' />
                <span className='sr-only'>닫기</span>
              </DialogClose>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
Calendar.displayName = 'Calendar';

interface ExtendedDayProps extends DayProps {
  navigatingDate: string | null;
  currentHour: number;
  onDateClick: (dateString: string) => void;
  writtenDates: Set<string>;
  weeklyReflections?: Array<{
    summaryId: string;
    startDate: Date;
    endDate: Date;
    review?: string | null;
  }>;
  onWeeklySummaryClick?: (summary: {
    summaryId: string;
    startDate: Date;
    endDate: Date;
    review?: string | null;
  }) => void;
}

const Day = ({
  date,
  displayMonth,
  navigatingDate,
  currentHour,
  onDateClick,
  writtenDates,
  weeklyReflections = [],
  onWeeklySummaryClick,
}: ExtendedDayProps) => {
  const isTodayDate = isToday(date);
  const isOutsideCurrentMonth = date.getMonth() !== displayMonth.getMonth();
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const isFutureDate = isFuture(date) || (isToday(date) && currentHour < 18);
  const disableToday = isTodayDate && currentHour < 18;
  const dateString = format(date, 'yyyy-MM-dd');
  const isNavigating = navigatingDate === dateString;

  // 해당 날짜에 회고가 작성되었는지 확인
  const hasDaily = writtenDates.has(dateString);

  // 해당 날짜가 주간 회고록이 작성된 주에 속하는지 확인
  const hasWeeklySummary = weeklyReflections.some((reflection) =>
    isDateInWeek(date, reflection.startDate, reflection.endDate)
  );

  // 공통 셀 스타일
  const cellStyle = cn(
    'border p-3.5 w-32 h-32 flex flex-col items-start font-normal text-xs',
    isWeekend && 'bg-neutral-900',
    isFutureDate && 'opacity-60 bg-neutral-900/50',
    !isFutureDate && 'cursor-pointer hover:bg-neutral-700',
    hasDaily && !isFutureDate && 'bg-neutral-800',
    hasWeeklySummary && !isFutureDate && 'bg-green-900/30',
    hasWeeklySummary && !isFutureDate && 'border-green-500/50',
    isOutsideCurrentMonth && 'opacity-80'
  );

  // 날짜 표시 스타일
  const dateStyle = cn(
    'rounded-full w-7 h-7 flex justify-center items-center',
    isTodayDate && 'bg-red-500 text-white',
    isFutureDate && !isTodayDate && 'bg-gray-700/60 text-gray-400',
    disableToday && 'bg-orange-900/70 text-orange-200/80',
    hasDaily && !isFutureDate && !isTodayDate && 'bg-blue-700 text-white',
    isOutsideCurrentMonth && hasDaily && 'text-neutral-400',
    isOutsideCurrentMonth && !hasDaily && 'text-neutral-500'
  );

  // 미래 날짜는 비활성화
  if (isFutureDate) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cellStyle}>
              <div className='w-full flex flex-col'>
                <div className='flex justify-between items-center'>
                  <span className={dateStyle}>{date.getDate()}</span>
                  <LockIcon className='h-3.5 w-3.5 text-gray-500 mr-1' />
                </div>
                {disableToday && (
                  <div className='mt-2 text-[10px] text-orange-400/80'>
                    오늘의 회고는 오후 6시 이후에 작성할 수 있습니다
                  </div>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {disableToday
              ? '오늘 회고는 오후 6시 이후에 작성할 수 있습니다'
              : '오늘 이후 날짜는 회고를 작성할 수 없어요!'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // 로딩 상태인 경우
  if (isNavigating) {
    return (
      <div className={cn(cellStyle, 'relative')}>
        <span className={dateStyle}>{date.getDate()}</span>
        <div className='absolute inset-0 flex items-center justify-center bg-black/40'>
          <Loader2 className='h-6 w-6 animate-spin text-primary' />
        </div>
      </div>
    );
  }

  // 클릭 가능한 날짜의 경우
  const handleWeeklySummaryOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const weeklySummary = weeklyReflections.find((reflection) =>
      isDateInWeek(date, reflection.startDate, reflection.endDate)
    );
    if (weeklySummary && onWeeklySummaryClick) {
      onWeeklySummaryClick(weeklySummary);
    }
  };

  // 주간 회고록이 있는 날짜는 전체 셀에 클릭 이벤트 추가
  if (hasWeeklySummary && !hasDaily) {
    return (
      <div
        className={cn(
          cellStyle,
          'relative cursor-pointer hover:bg-green-900/50 transition-colors'
        )}
        onClick={handleWeeklySummaryOpen}
      >
        <div className='flex justify-between items-center w-full'>
          <span className={dateStyle}>{date.getDate()}</span>
          <FileText className='h-5 w-5 text-green-400 mr-1' />
        </div>

        <div className='mt-3 flex flex-col items-center justify-center w-full'>
          <div className='text-center text-green-400/90 font-medium mb-2'>
            주간 회고록
          </div>
          <button
            className='px-3 py-1.5 bg-green-800/50 hover:bg-green-700/60 text-green-100 rounded-md text-xs font-medium transition-colors flex items-center'
            onClick={handleWeeklySummaryOpen}
          >
            <FileText className='h-3.5 w-3.5 mr-1.5' />
            확인하기
          </button>
        </div>
      </div>
    );
  }

  // 일일 회고와 주간 회고록이 모두 있는 경우
  if (hasDaily && hasWeeklySummary) {
    return (
      <div className={cellStyle}>
        <div className='flex justify-between items-center w-full'>
          <span className={dateStyle}>{date.getDate()}</span>
          <div className='flex items-center'>
            <BookOpen className='h-4 w-4 text-blue-400 mr-1' />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className='ml-1 p-1 hover:bg-green-800/40 rounded-full transition-colors'
                    onClick={handleWeeklySummaryOpen}
                  >
                    <FileText className='h-4 w-4 text-green-400' />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>주간 회고록 보기</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className='mt-2 line-clamp-2 text-xs text-gray-400 overflow-hidden'>
          작성 완료
        </div>

        <button
          className='mt-2 w-full px-2 py-1 bg-green-800/40 hover:bg-green-700/50 text-green-100 rounded text-xs font-medium transition-colors flex items-center justify-center'
          onClick={handleWeeklySummaryOpen}
        >
          <FileText className='h-3 w-3 mr-1' />
          주간 회고록 보기
        </button>
      </div>
    );
  }

  // 일반 날짜 셀 (일일 회고만 있는 경우)
  return (
    <div className={cellStyle} onClick={() => onDateClick(dateString)}>
      <div className='flex justify-between items-center w-full'>
        <span className={dateStyle}>{date.getDate()}</span>
        <div className='flex items-center'>
          {hasDaily && <BookOpen className='h-4 w-4 text-blue-400 mr-1' />}
        </div>
      </div>

      {hasDaily && (
        <div className='mt-2 line-clamp-3 text-xs text-gray-400 overflow-hidden'>
          작성 완료
        </div>
      )}
    </div>
  );
};

export { Calendar };
