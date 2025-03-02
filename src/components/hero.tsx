import Link from 'next/link';

export function Hero() {
  return (
    <div className='grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-noto-sans-kr)]'>
      <main className='flex flex-col gap-8 row-start-2 items-center sm:items-start'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
          데이로그(Daylog)
        </h1>

        <div className='flex gap-4 items-center flex-col sm:flex-row'>
          <Link
            className='rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5'
            href='/login'
          >
            이메일 로그인
          </Link>
        </div>
      </main>
    </div>
  );
}
