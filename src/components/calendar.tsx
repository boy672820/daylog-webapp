'use client';

import * as React from 'react';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, LockIcon, Loader2 } from 'lucide-react';
import { DayPicker, DayProps } from 'react-day-picker';
import { format, isToday, isFuture } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const router = useRouter();
  const [navigatingDate, setNavigatingDate] = useState<string | null>(null);

  // 날짜 클릭 핸들러
  const handleDateClick = (dateStr: string) => {
    setNavigatingDate(dateStr);
    router.push(`/review?date=${dateStr}`);
  };

  return (
    <DayPicker
      locale={ko}
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
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
            onDateClick={handleDateClick}
          />
        ),
        IconLeft: () => <ChevronLeft className='h-4 w-4' />,
        IconRight: () => <ChevronRight className='h-4 w-4' />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

interface ExtendedDayProps extends DayProps {
  navigatingDate: string | null;
  onDateClick: (dateStr: string) => void;
}

const Day = ({
  date,
  displayMonth,
  navigatingDate,
  onDateClick,
}: ExtendedDayProps) => {
  const isTodayDate = isToday(date);
  const isOutsideCurrentMonth = date.getMonth() !== displayMonth.getMonth();
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const isFutureDate =
    isFuture(date) || (isToday(date) && new Date().getHours() < 18);
  const currentHour = new Date().getHours();
  const disableToday = isTodayDate && currentHour < 18;
  const dateStr = format(date, 'yyyy-MM-dd');
  const isNavigating = navigatingDate === dateStr;

  // 공통 셀 스타일
  const cellStyle = cn(
    'border p-3.5 w-32 h-32 flex items-start font-normal text-xs',
    isWeekend && 'bg-neutral-900',
    isFutureDate && 'opacity-60 bg-neutral-900/50',
    !isFutureDate && 'cursor-pointer hover:bg-neutral-700'
  );

  // 날짜 표시 스타일
  const dateStyle = cn(
    'rounded-full w-7 h-7 flex justify-center items-center',
    isTodayDate && 'bg-red-500 text-white',
    isFutureDate && !isTodayDate && 'bg-gray-700/60 text-gray-400',
    disableToday && 'bg-orange-900/70 text-orange-200/80',
    isOutsideCurrentMonth && 'text-neutral-500'
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
      <span className={dateStyle}>{date.getDate()}</span>
    </div>
  );
};

export { Calendar };
