'use client';

import { useState } from 'react';
import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import Link from 'next/link';

export default function ConfirmSignUp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code || code.trim().length === 0) {
      setError('인증 코드를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode: code,
      });

      if (isSignUpComplete) {
        // 인증 성공 시 로그인 페이지로 이동
        router.push('/login?verified=true');
      } else {
        setError('추가 인증이 필요합니다.');
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'CodeMismatchException') {
          setError('인증 코드가 일치하지 않습니다. 다시 확인해주세요.');
        } else if (error.name === 'ExpiredCodeException') {
          setError('인증 코드가 만료되었습니다. 새로운 코드를 요청해주세요.');
        } else if (error.name === 'UserNotFoundException') {
          setError('등록되지 않은 이메일입니다.');
        } else {
          console.error(error);
          setError('인증 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setResendSuccess(false);
    setResendLoading(true);

    try {
      await resendSignUpCode({ username: email });
      setResendSuccess(true);
      
      // 3초 후 성공 메시지 숨김
      setTimeout(() => {
        setResendSuccess(false);
      }, 3000);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'UserNotFoundException') {
          setError('등록되지 않은 이메일입니다.');
        } else if (error.name === 'LimitExceededException') {
          setError('너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.');
        } else {
          console.error(error);
          setError('인증 코드 재전송 중 오류가 발생했습니다.');
        }
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-black p-4 sm:p-6'>
      <div className='w-full max-w-sm space-y-6'>
        <div className='space-y-2 text-center'>
          <h1 className='text-3xl font-bold text-white'>회원가입 인증</h1>
          <p className='text-muted-foreground'>
            이메일로 전송된 인증 코드를 입력해주세요
          </p>
        </div>

        <div className='space-y-4'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {error && (
              <div className='p-3 text-sm text-red-400 bg-red-900/30 rounded-md'>
                {error}
              </div>
            )}
            
            {resendSuccess && (
              <div className='p-3 text-sm text-green-400 bg-green-900/30 rounded-md'>
                인증 코드가 재전송되었습니다. 이메일을 확인해주세요.
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='email' className='text-gray-300'>
                이메일
              </Label>
              <Input
                id='email'
                type='email'
                value={email}
                disabled
                className='bg-gray-800'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='code' className='text-gray-300'>
                인증 코드
              </Label>
              <Input
                id='code'
                type='text'
                placeholder='인증 코드 6자리'
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className='text-xs text-muted-foreground'>
                이메일로 전송된 인증 코드 6자리를 입력해주세요.
              </p>
            </div>

            <div className='space-y-3'>
              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? '인증 중...' : '인증하기'}
              </Button>
              
              <Button 
                type='button' 
                variant='ghost' 
                className='w-full' 
                onClick={handleResendCode}
                disabled={resendLoading}
              >
                {resendLoading ? '재전송 중...' : '인증 코드 다시 받기'}
              </Button>
            </div>
          </form>

          <div className='text-center text-sm text-muted-foreground'>
            다시 회원가입하시겠습니까?{' '}
            <Link href='/signup' className='text-blue-400'>
              회원가입으로 돌아가기
            </Link>
          </div>
          
          <div className='text-center text-sm text-muted-foreground'>
            <Link href='/login' className='text-blue-400'>
              로그인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
