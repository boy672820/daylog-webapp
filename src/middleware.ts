// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { runWithAmplifyServerContext } from '@/utils/amplify-utils';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // 인증 상태 확인
  const authenticated = await runWithAmplifyServerContext({
    nextServerContext: { request, response },
    operation: async (contextSpec) => {
      try {
        const session = await fetchAuthSession(contextSpec, {});
        return session.tokens !== undefined;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
  });

  // 로그인/회원가입 페이지 처리 - 인증된 사용자는 홈으로 리다이렉트
  if (
    authenticated &&
    (pathname === '/login' || pathname === '/signup' || pathname === '/')
  ) {
    return NextResponse.redirect(new URL('/calendar', request.url));
  }

  // 보호된 경로 처리 - 인증되지 않은 사용자는 로그인으로 리다이렉트
  if (
    !authenticated &&
    !pathname.match(/^\/(api|_next\/static|_next\/image|favicon\.ico|login||)/)
  ) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

// 모든 경로에 미들웨어 적용 (특별히 제외할 경로가 있다면 matcher를 사용)
