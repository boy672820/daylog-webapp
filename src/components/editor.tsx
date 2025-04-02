'use client';

import { generateClient } from 'aws-amplify/data';
import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { RichTextEditor } from './tiptap/rich-text-editor';
import { Button } from './ui/button';
import { useDebounce } from '../hooks/use-debounce';
import { useAuthSession } from '../hooks/use-auth-session';
import { content as defaultContent } from '@/lib/content';
import { type Schema } from '../../amplify/data/resource';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

const client = generateClient<Schema>({
  authMode: 'userPool',
});

// 로딩 스피너 컴포넌트
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center justify-center animate-spin rounded-full border-2 border-solid border-current border-r-transparent h-5 w-5 text-primary", className)} role="status">
      <span className="sr-only">로딩 중...</span>
    </div>
  );
}

export function Editor({
  date,
  content: _content,
}: {
  date: Date;
  content?: string;
}) {
  const [content, setContent] = useState<string | null>(_content || null);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedContent = useDebounce(content, 1000);
  const { currentUser } = useAuthSession();

  const dateFormat = format(date, 'yyyy-MM-dd');

  const updateDaily = useCallback(async () => {
    if (debouncedContent === null) return;
    
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      await client.models.Daily.update({
        userId: currentUser.userId,
        date: dateFormat,
        content: debouncedContent,
      });
      console.log('Update daily!');
    } catch (error) {
      console.error('Failed to update daily:', error);
    } finally {
      // 최소 500ms의 로딩 시간 보장
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 500 - elapsedTime);
      
      if (remainingTime > 0) {
        setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      } else {
        setIsLoading(false);
      }
    }
  }, [dateFormat, currentUser, debouncedContent]);

  useEffect(() => {
    updateDaily();
  }, [debouncedContent, updateDaily]);

  const initialContent = content || defaultContent;

  return (
    <div className='flex flex-col px-4 min-h-screen max-w-6xl mx-auto'>
      <section className='container mx-auto pt-16 pb-8'>
        <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
          {format(date, 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
        </h1>
        <h2 className='text-xl font-semibold text-gray-700 dark:text-gray-300'>
          오늘의 리뷰
        </h2>
      </section>
      <main className='flex-grow container mx-auto' id='editor'>
        <RichTextEditor
          className='w-full rounded-xl'
          onUpdate={setContent}
          initialContent={initialContent}
        />
        <div className='flex my-4 justify-end items-center'>
          <div className="flex items-center mr-4">
            <span className="text-sm text-muted-foreground mr-2 flex items-center">
              {isLoading ? '저장 중...' : (
                <>
                  자동 저장됨
                  <CheckCircle className="ml-1 h-4 w-4 text-green-500" />
                </>
              )}
            </span>
            {isLoading && <LoadingSpinner />}
          </div>
          <Button
            href={`/calendar?date=${format(date, 'yyyy-MM')}`}
            variant={'outline'}
            size={'lg'}
          >
            캘린더로 이동
          </Button>
        </div>
      </main>
    </div>
  );
}
