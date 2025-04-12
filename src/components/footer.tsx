export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='border-t border-border py-6 md:px-8 md:py-0 w-full'>
      <div className='container-wrapper'>
        <div className='container py-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {/* 회사 정보 및 저작권 */}
            <div className='text-sm text-muted-foreground'>
              <h3 className='font-semibold mb-2 text-foreground'>DayLog</h3>
              <p className='mb-1'>매일의 기록을 더 가치있게</p>
              <p>&copy; {currentYear} DayLog. All rights reserved.</p>
            </div>

            {/* 링크 */}
            <div className='text-sm text-muted-foreground'>
              <h3 className='font-semibold mb-2 text-foreground'>링크</h3>
              <ul className='space-y-2'>
                <li>
                  <a
                    href='https://github.com/boy672820/daylog-webapp'
                    target='_blank'
                    rel='noreferrer'
                    className='hover:text-primary hover:underline'
                  >
                    GitHub 저장소
                  </a>
                </li>
                <li>
                  <a
                    href='https://github.com/boy672820/daylog-webapp/issues/new'
                    target='_blank'
                    rel='noreferrer'
                    className='hover:text-primary hover:underline'
                  >
                    서비스 피드백
                  </a>
                </li>
                <li>
                  <a
                    href='https://www.linkedin.com/in/seonzoo'
                    target='_blank'
                    rel='noreferrer'
                    className='hover:text-primary hover:underline'
                  >
                    개발자 프로필
                  </a>
                </li>
              </ul>
            </div>

            {/* 연락처 */}
            <div className='text-sm text-muted-foreground'>
              <h3 className='font-semibold mb-2 text-foreground'>연락처</h3>
              <ul className='space-y-2'>
                <li>
                  <a
                    href='mailto:boy672820@gmail.com'
                    className='hover:text-primary hover:underline'
                  >
                    boy672820@gmail.com
                  </a>
                </li>
                <li>
                  <a
                    href='https://github.com/boy672820/daylog-webapp/stargazers'
                    target='_blank'
                    rel='noreferrer'
                    className='hover:text-primary hover:underline flex items-center'
                  >
                    <span>GitHub에서 스타 주기</span>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='ml-1 h-4 w-4'
                    >
                      <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' />
                    </svg>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* 모바일에서 보이는 저작권 정보 */}
          <div className='mt-8 pt-4 border-t border-border text-center text-xs text-muted-foreground md:hidden'>
            <p>&copy; {currentYear} DayLog. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
