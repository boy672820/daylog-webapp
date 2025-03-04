'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LockIcon,
  Loader2,
  BookOpen,
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
import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../amplify/data/resource';
import { useAuthSession } from '../hooks/use-auth-session';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const client = generateClient<Schema>();

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [navigatingDate, setNavigatingDate] = useState<string | null>(null);
  const [month, setMonth] = useState<Date>(new Date());
  const [writtenDates, setWrittenDates] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { currentUser } = useAuthSession();

  // 날짜 범위에 따른 데이터 조회
  const getDailies = useCallback(
    async (date: Date = new Date()) => {
      if (!currentUser.isInitialized || !currentUser.userId) {
        return;
      }

      setIsLoading(true);

      try {
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

        const { data: dailies } =
          await client.models.Daily.listDailyByUserIdAndDate({
            userId: currentUser.userId,
            date: {
              between: [formatDate(calendarStart), formatDate(calendarEnd)],
            },
          });

        // Set으로 변환하여 빠른 조회가 가능하게 함
        const dateSet = new Set<string>();
        const contentMap = new Map<string, string>();

        dailies.forEach((daily) => {
          if (daily?.date && daily?.content) {
            dateSet.add(daily.date);
            if (daily.content) {
              contentMap.set(daily.date, daily.content);
            }
          }
        });

        setWrittenDates(dateSet);
      } catch (error) {
        console.error('Failed to fetch dailies:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser.isInitialized, currentUser.userId]
  );

  // 초기 데이터 로드
  useEffect(() => {
    getDailies(month);
  }, [getDailies, month]);

  // 월 변경 핸들러
  const handleMonthChange = (date: Date) => {
    setMonth(date);
    getDailies(date);
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (dateStr: string) => {
    setNavigatingDate(dateStr);
    router.push(`/review?date=${dateStr}`);
  };

  const currentHour = new Date().getHours();

  return (
    <div className='space-y-4'>
      {isLoading ? (
        <div className='h-[500px] flex items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
        </div>
      ) : (
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
            head_cell: 'text-muted-foreground w-32 py-2.5 font-normal text-xs',
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
                onDateClick={handleDateClick}
              />
            ),
            IconLeft: () => <ChevronLeft className='h-4 w-4' />,
            IconRight: () => <ChevronRight className='h-4 w-4' />,
          }}
          {...props}
        />
      )}
    </div>
  );
}
Calendar.displayName = 'Calendar';

interface ExtendedDayProps extends DayProps {
  navigatingDate: string | null;
  currentHour: number;
  onDateClick: (dateStr: string) => void;
  writtenDates: Set<string>;
}

const Day = ({
  date,
  displayMonth,
  navigatingDate,
  currentHour,
  onDateClick,
  writtenDates,
}: ExtendedDayProps) => {
  const isTodayDate = isToday(date);
  const isOutsideCurrentMonth = date.getMonth() !== displayMonth.getMonth();
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const isFutureDate = isFuture(date) || (isToday(date) && currentHour < 18);
  const disableToday = isTodayDate && currentHour < 18;
  const dateStr = format(date, 'yyyy-MM-dd');
  const isNavigating = navigatingDate === dateStr;

  // 해당 날짜에 회고가 작성되었는지 확인
  const hasDaily = writtenDates.has(dateStr);

  // 공통 셀 스타일
  const cellStyle = cn(
    'border p-3.5 w-32 h-32 flex flex-col items-start font-normal text-xs',
    isWeekend && 'bg-neutral-900',
    isFutureDate && 'opacity-60 bg-neutral-900/50',
    !isFutureDate && 'cursor-pointer hover:bg-neutral-700',
    hasDaily && !isFutureDate && 'bg-neutral-800',
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
  return (
    <div className={cellStyle} onClick={() => onDateClick(dateStr)}>
      <div className='flex justify-between items-center w-full'>
        <span className={dateStyle}>{date.getDate()}</span>
        {hasDaily && <BookOpen className='h-4 w-4 text-blue-400 mr-1' />}
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
