'use client';

import { useState } from 'react';
import { signUp } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import Link from 'next/link';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    name?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  // 이메일 유효성 검사 함수
  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 폼 초기화
    setError(null);
    const errors: {
      email?: string;
      name?: string;
    } = {};

    // 이메일 검증
    if (!validateEmail(email)) {
      errors.email = '유효한 이메일 주소를 입력해주세요.';
    }

    // 이름 검증
    if (!name || name.trim().length < 2) {
      errors.name = '이름은 2자 이상 입력해주세요.';
    }

    // 에러가 있으면 폼 제출 중단
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      // 비밀번호 없이 회원가입 (임시 비밀번호 생성)
      const tempPassword =
        Math.random().toString(36).slice(2, 10) +
        Math.random().toString(36).toUpperCase().slice(2, 4) +
        '!1';

      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password: tempPassword, // 임시 비밀번호 사용
        options: {
          userAttributes: {
            email,
            name,
          },
          autoSignIn: false, // 자동 로그인 비활성화
        },
      });

      // 이메일 인증 페이지로 이동
      router.push(`/confirm-signup?email=${encodeURIComponent(email)}`);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'UsernameExistsException') {
          setFieldErrors({
            ...fieldErrors,
            email: '이미 가입된 이메일 주소입니다.',
          });
        } else {
          console.error(error);
          setError(
            '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
          );
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-black p-4 sm:p-6'>
      <div className='w-full max-w-sm space-y-6'>
        <div className='space-y-2 text-center'>
          <h1 className='text-3xl font-bold text-white'>회원가입</h1>
          <p className='text-muted-foreground'>
            계정을 만들어 데이로그를 시작하세요
          </p>
        </div>

        <div className='space-y-4'>
          <Button variant='outline' className='w-full' disabled={isLoading}>
            GitHub로 가입하기
          </Button>

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t bg-accent' />
            </div>
            <div className='relative flex justify-center text-xs'>
              <span className='bg-black px-2'>또는 이메일로 가입하기</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            {error && (
              <div className='p-3 text-sm text-red-400 bg-red-900/30 rounded-md'>
                {error}
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='name' className='text-gray-300'>
                이름
              </Label>
              <Input
                id='name'
                type='text'
                placeholder='홍길동'
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFieldErrors({ ...fieldErrors, name: undefined });
                }}
                required
                disabled={isLoading}
                className={
                  fieldErrors.name ? 'border-red-500 focus:border-red-500' : ''
                }
              />
              {fieldErrors.name && (
                <p className='text-xs text-red-400'>{fieldErrors.name}</p>
              )}
            </div>

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
                  setFieldErrors({ ...fieldErrors, email: undefined });
                }}
                required
                disabled={isLoading}
                className={
                  fieldErrors.email ? 'border-red-500 focus:border-red-500' : ''
                }
              />
              {fieldErrors.email && (
                <p className='text-xs text-red-400'>{fieldErrors.email}</p>
              )}
              <p className='text-xs text-muted-foreground'>
                이메일로 인증 코드가 전송됩니다. 실제 사용하는 이메일을
                입력해주세요.
              </p>
            </div>

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? '회원가입 중...' : '회원가입'}
            </Button>
          </form>

          <div className='text-center text-sm text-muted-foreground'>
            이미 계정이 있으신가요?{' '}
            <Link href='/login' className='text-blue-400'>
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
