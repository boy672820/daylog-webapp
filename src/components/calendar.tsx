'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, DayProps } from 'react-day-picker';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
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
        Day,
        IconLeft: () => <ChevronLeft className='h-4 w-4' />,
        IconRight: () => <ChevronRight className='h-4 w-4' />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

const Day = ({ date, displayMonth }: DayProps) => {
  const isToday = new Date().toDateString() === date.toDateString();
  const isOutsideCurrentMonth = date.getMonth() !== displayMonth.getMonth();
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  return (
    <Link
      className={cn(
        'border p-3.5 w-32 h-32 flex items-start text-justify font-normal aria-selected:opacity-500 text-xs hover:bg-neutral-700',
        isWeekend && 'bg-neutral-900'
      )}
      href={{
        pathname: '/review',
        query: { date: format(date, 'yyyy-MM-dd') },
      }}
    >
      <span
        className={cn(
          'rounded-full w-7 h-7 flex justify-center items-center',
          isToday && 'bg-red-500 text-white',
          isOutsideCurrentMonth && 'text-neutral-500'
        )}
      >
        {date.getDate()}
      </span>
    </Link>
  );
};

export { Calendar };
