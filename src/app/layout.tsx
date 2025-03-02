import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

import '@/styles/globals.css';
import ConfigureAmplifyClientSide from '../components/configure-amplify';

const notoSansKR = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '데이로그(Daylog) | 나를 돌아보는 시간',
  description: '데이로그는 회고를 통한 성장을 돕는 도구입니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ko' suppressHydrationWarning>
      <body className={notoSansKR.className}>
        <ConfigureAmplifyClientSide />
        <ThemeProvider
          attribute='class'
          defaultTheme='dark'
          enableSystem
          disableTransitionOnChange
        >
          <div className='relative min-h-screen bg-black text-white flex flex-col'>
            <main className='flex-1'>{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
