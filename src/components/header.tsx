'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchUserAttributes,
  signOut,
  resendSignUpCode,
} from 'aws-amplify/auth';
import {
  CircleUser,
  Settings,
  LogOut,
  Mail,
  AlertTriangle,
  CheckCircle,
  Flame,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// 사용자 콤보 정보를 가져오는 함수 (실제 API 연동 필요)
const fetchUserStreak = async (): Promise<{
  currentStreak: number;
  longestStreak: number;
  lastReflectionDate: Date | null;
}> => {
  // 실제 API 호출로 대체 필요
  // 임시 데이터 반환
  return {
    currentStreak: 7, // 현재 콤보
    longestStreak: 14, // 최장 콤보
    lastReflectionDate: new Date(), // 마지막 회고 날짜
  };
};

export function Header() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(
    null
  );
  // const [userId, setUserId] = useState<string | null>(null);
  const [streakInfo, setStreakInfo] = useState<{
    currentStreak: number;
    longestStreak: number;
    lastReflectionDate: Date | null;
  }>({
    currentStreak: 0,
    longestStreak: 0,
    lastReflectionDate: null,
  });
  const [loadingStreak, setLoadingStreak] = useState(false);

  // 사용자 정보 가져오기
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const userAttributes = await fetchUserAttributes();
        setEmail(userAttributes.email || null);
        // setUserId(userAttributes.sub || null);

        // 이메일 인증 상태 확인
        const emailVerified = userAttributes.email_verified === 'true';
        setIsEmailVerified(emailVerified);

        // 인증된 사용자인 경우 콤보 정보 가져오기
        if (emailVerified && userAttributes.sub) {
          fetchUserStreakInfo();
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };

    getUserInfo();
  }, []);

  // 콤보 정보 가져오기
  const fetchUserStreakInfo = async () => {
    setLoadingStreak(true);
    try {
      const streak = await fetchUserStreak();
      setStreakInfo(streak);
    } catch (error) {
      console.error('Failed to fetch user streak:', error);
    } finally {
      setLoadingStreak(false);
    }
  };

  // 재전송 쿨다운 타이머
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // 인증 메시지 자동 제거 타이머
  useEffect(() => {
    if (verificationMessage) {
      const timer = setTimeout(() => setVerificationMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [verificationMessage]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleResendVerification = async () => {
    if (!email || resendCooldown > 0 || resendingVerification) return;

    setResendingVerification(true);
    try {
      await resendSignUpCode({ username: email });
      setVerificationMessage(
        '인증 이메일이 재전송되었습니다. 이메일을 확인해주세요.'
      );
      setResendCooldown(60); // 60초 쿨다운
    } catch (error) {
      console.error('Error resending verification email:', error);
      if (error instanceof Error) {
        if (error.name === 'LimitExceededException') {
          setVerificationMessage(
            '요청 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요.'
          );
        } else {
          setVerificationMessage(
            '인증 이메일 재전송에 실패했습니다. 다시 시도해주세요.'
          );
        }
      }
    } finally {
      setResendingVerification(false);
    }
  };

  // 이메일 인증 상태에 따른 아이콘 및 메시지
  const renderVerificationStatus = () => {
    if (isEmailVerified === null) return null;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className='flex items-center gap-1'>
              {isEmailVerified ? (
                <CheckCircle className='h-4 w-4 text-green-400' />
              ) : (
                <AlertTriangle className='h-4 w-4 text-yellow-400' />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isEmailVerified
              ? '이메일이 인증되었습니다.'
              : '이메일 인증이 필요합니다. 이메일을 확인하거나 인증 메일을 다시 요청하세요.'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // 콤보 정보 표시
  const renderStreakInfo = () => {
    if (loadingStreak) {
      return (
        <div className='flex items-center gap-1 text-gray-400'>
          <Loader2 className='h-3 w-3 animate-spin' />
          <span className='text-xs'>콤보 정보 로딩 중...</span>
        </div>
      );
    }

    if (!isEmailVerified || streakInfo.currentStreak === 0) {
      return null;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className='flex items-center gap-1.5 cursor-help'>
              <Badge className='bg-orange-600 hover:bg-orange-700 flex items-center gap-1 px-3'>
                <Flame className='h-4 w-4' />
                <span className='text-sm font-bold'>
                  {streakInfo.currentStreak}일 연속
                </span>
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className='space-y-1'>
              <p className='font-medium'>
                현재 {streakInfo.currentStreak}일 연속 작성 중!
              </p>
              <p className='text-xs text-gray-400'>
                최장 기록: {streakInfo.longestStreak}일
              </p>
              {streakInfo.lastReflectionDate && (
                <p className='text-xs text-gray-400'>
                  마지막 회고:{' '}
                  {new Date(streakInfo.lastReflectionDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <header className='border-b border-input bg-black shadow-sm'>
      <div className='container mx-auto max-w-4xl flex flex-col w-full px-4'>
        {/* 인증 메시지 표시 */}
        {verificationMessage && (
          <div className='w-full mt-2'>
            <Alert variant='default' className='bg-gray-900 border-green-800'>
              <AlertDescription>{verificationMessage}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* 헤더 내용 */}
        <div className='flex h-14 items-center justify-between'>
          <div className='flex items-center gap-4'>
            {/* 로고 및 타이틀 */}
            <div
              onClick={() => router.push('/calendar')}
              className='cursor-pointer flex items-center gap-2'
            >
              <h1 className='text-xl font-bold text-white'>Daylog</h1>
              <span className='text-xs bg-gray-800 px-2 py-0.5 rounded-full text-gray-400'>
                Beta
              </span>
            </div>

            {/* 콤보 정보 추가 */}
            {renderStreakInfo()}
          </div>

          {/* 사용자 메뉴 */}
          <div className='flex items-center gap-4'>
            {email && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='relative h-8 w-8 rounded-full hover:bg-gray-800'
                  >
                    <CircleUser className='h-12 w-12 text-white' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='end'
                  className='w-56 border-input bg-black text-white'
                >
                  <DropdownMenuLabel className='font-normal'>
                    <div className='flex flex-col space-y-1'>
                      <p className='text-sm font-medium leading-none items-center'>
                        사용자
                      </p>
                      <p className='text-xs leading-none flex text-muted-foreground gap-1'>
                        {email}
                        {renderVerificationStatus()}
                      </p>
                      {/* 드롭다운 메뉴에도 콤보 정보 표시 */}
                      {streakInfo.currentStreak > 0 && (
                        <div className='flex items-center gap-1 mt-2 text-orange-400'>
                          {/* <Flame className='h-3 w-3' /> */}
                          <span className='text-xs'>
                            🔥 {streakInfo.currentStreak}일 연속 회고 작성 중
                          </span>
                        </div>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className='bg-input' />
                  {!isEmailVerified && (
                    <DropdownMenuItem
                      className='text-sm hover:bg-gray-800 hover:text-white focus:bg-gray-800 focus:text-white cursor-pointer'
                      onClick={handleResendVerification}
                      disabled={resendingVerification || resendCooldown > 0}
                    >
                      {resendingVerification ? (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      ) : (
                        <Mail className='mr-2 h-4 w-4' />
                      )}
                      <span>
                        {resendingVerification
                          ? '전송 중...'
                          : resendCooldown > 0
                          ? `인증 메일 재전송 (${resendCooldown}초)`
                          : '인증 메일 재전송'}
                      </span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className='text-sm hover:bg-gray-800 hover:text-white focus:bg-gray-800 focus:text-white cursor-pointer'
                    onClick={() => router.push('/settings/profile')}
                  >
                    <Settings className='mr-2 h-4 w-4' />
                    <span>설정</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className='text-sm hover:bg-gray-800 hover:text-white focus:bg-gray-800 focus:text-white cursor-pointer'
                    onClick={handleSignOut}
                  >
                    <LogOut className='mr-2 h-4 w-4' />
                    <span>로그아웃</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
