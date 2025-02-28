'use client';

import { useState } from 'react';
import { signIn } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import Link from 'next/link';

export default function Login() {
  const router = useRouter(); // useRouter 훅 사용
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 이메일 유효성 검사 함수
  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);
    setPasswordError(null);

    // 이메일 검증
    if (!validateEmail(email)) {
      setEmailError('유효한 이메일 주소를 입력해주세요.');
      return;
    }

    // 비밀번호 검증 (최소 입력 여부만)
    if (!password || password.length < 1) {
      setPasswordError('비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      await signIn({ username: email, password });
      router.push('/calendar');
    } catch (error) {
      if (error instanceof Error) {
        // 에러 유형별로 다른 메시지 제공
        if (error.name === 'UserNotFoundException') {
          setEmailError(
            '등록되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.'
          );
        } else if (error.name === 'NotAuthorizedException') {
          setPasswordError('비밀번호가 일치하지 않습니다. 다시 확인해주세요.');
        } else if (error.name === 'UserNotConfirmedException') {
          setError(
            '이메일 인증이 완료되지 않았습니다. 인증 메일을 확인해주세요.'
          );
        } else if (error.message?.includes('network')) {
          setError('네트워크 연결을 확인해주세요.');
        } else {
          console.error(error);
          setError('로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
      }

      setIsLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-black p-4 sm:p-6'>
      <div className='w-full max-w-sm space-y-6'>
        <div className='space-y-2 text-center'>
          <h1 className='text-3xl font-bold text-white'>로그인</h1>
          <p className='text-muted-foreground'>
            계정에 로그인하여 데이로그를 시작하세요
          </p>
        </div>

        <div className='space-y-4'>
          <Button variant='outline' className='w-full' disabled={isLoading}>
            GitHub로 로그인
          </Button>

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t bg-accent' />
            </div>
            <div className='relative flex justify-center text-xs'>
              <span className='bg-black px-2'>
                또는 이메일로 계속하기
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            {error && (
              <div className='p-3 text-sm text-red-400 bg-red-900/30 rounded-md'>
                {error}
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='email' className='text-gray-300'>
                이메일
              </Label>
              <Input
                id='email'
                type='email'
                placeholder='your@email.com'
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                required
                disabled={isLoading}
                className={
                  emailError ? 'border-red-500 focus:border-red-500' : ''
                }
              />
              {emailError && (
                <p className='text-xs text-red-400'>{emailError}</p>
              )}
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='password' className='text-gray-300'>
                  비밀번호
                </Label>
                <a href='/forgot-password' className='text-sm text-blue-400'>
                  비밀번호 찾기
                </a>
              </div>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(null);
                }}
                required
                disabled={isLoading}
                className={
                  passwordError ? 'border-red-500 focus:border-red-500' : ''
                }
              />
              {passwordError && (
                <p className='text-xs text-red-400'>{passwordError}</p>
              )}
            </div>

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          <div className='text-center text-sm text-muted-foreground'>
            계정이 없으신가요?{' '}
            <Link href='/signup' className='text-blue-400'>
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
