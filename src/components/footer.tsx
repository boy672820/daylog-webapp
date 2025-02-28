export function Footer() {
  return (
    <footer className='border-t border-border py-6 md:px-8 md:py-0 w-full'>
      <div className='container-wrapper'>
        <div className='container py-4'>
          <div className='text-balance text-center text-sm leading-loose text-muted-foreground md:text-left'>
            <ul className='gap-4'>
              <li>
                Built by{' '}
                <a
                  href='https://www.linkedin.com/in/seonzoo'
                  target='_blank'
                  rel='noreferrer'
                  className='font-medium underline underline-offset-4 hover:text-primary'
                >
                  seonzoo
                </a>
              </li>
              <li>
                Give me a Star by{' '}
                <a
                  href='https://github.com/boy672820/review-note-webapp'
                  target='_blank'
                  rel='noreferrer'
                  className='font-medium underline underline-offset-4 hover:text-primary'
                >
                  Github.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
