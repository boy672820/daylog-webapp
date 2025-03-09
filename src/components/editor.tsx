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

const client = generateClient<Schema>();

export function Editor({
  date,
  content: _content,
}: {
  date: Date;
  content?: string;
}) {
  const [content, setContent] = useState<string | null>(_content || null);

  const debouncedContent = useDebounce(content, 1000);
  const { currentUser } = useAuthSession();

  const dateFormat = format(date, 'yyyy-MM-dd');

  const updateDaily = useCallback(async () => {
    if (debouncedContent === null) return;

    await client.models.Daily.update({
      userId: currentUser.userId,
      date: dateFormat,
      content: debouncedContent,
    });
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
        <div className='flex my-4 justify-end'>
          <Button variant={'ghost'} size={'lg'} disabled>
            작성하신 내용은 자동으로 저장됩니다.
          </Button>
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
