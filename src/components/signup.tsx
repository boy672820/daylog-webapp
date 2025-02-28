'use client';

import { useState } from 'react';
import { confirmSignUp, resendSignUpCode, signUp } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import Link from 'next/link';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSignUpComplete, setIsSignUpComplete] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

    // 비밀번호 일치 검증
    if (password !== confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 비밀번호 정책 유효성 검사
    const passwordValidation = validatePassword(password);
    if (passwordValidation !== true) {
      setPasswordError(passwordValidation);
      return;
    }

    setIsLoading(true);

    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
          autoSignIn: true,
        },
      });
      setIsSignUpComplete(true);
    } catch (error) {
      if (error instanceof Error) {
        // 비밀번호 정책 관련 오류 처리
        if (error.name === 'InvalidPasswordException') {
          if (error.message.includes('uppercase')) {
            setPasswordError(
              '비밀번호에는 최소 1개 이상의 대문자가 포함되어야 합니다.'
            );
          } else if (error.message.includes('lowercase')) {
            setPasswordError(
              '비밀번호에는 최소 1개 이상의 소문자가 포함되어야 합니다.'
            );
          } else if (error.message.includes('number')) {
            setPasswordError(
              '비밀번호에는 최소 1개 이상의 숫자가 포함되어야 합니다.'
            );
          } else if (error.message.includes('symbol')) {
            setPasswordError(
              '비밀번호에는 최소 1개 이상의 특수문자가 포함되어야 합니다.'
            );
          } else {
            setPasswordError(
              '비밀번호는 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.'
            );
          }
        } else if (error.name === 'UsernameExistsException') {
          setEmailError('이미 사용 중인 이메일 주소입니다.');
        } else {
          setError('회원가입에 실패했습니다. 다시 시도해주세요.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 비밀번호 유효성 검사 함수
  const validatePassword = (password: string): true | string => {
    if (password.length < 8) {
      return '비밀번호는 최소 8자 이상이어야 합니다.';
    }

    if (!/[A-Z]/.test(password)) {
      return '비밀번호에는 최소 1개 이상의 대문자가 포함되어야 합니다.';
    }

    if (!/[a-z]/.test(password)) {
      return '비밀번호에는 최소 1개 이상의 소문자가 포함되어야 합니다.';
    }

    if (!/[0-9]/.test(password)) {
      return '비밀번호에는 최소 1개 이상의 숫자가 포함되어야 합니다.';
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      return '비밀번호에는 최소 1개 이상의 특수문자가 포함되어야 합니다.';
    }

    return true;
  };

  // 이메일 유효성 검사 함수
  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await confirmSignUp({
        username: email,
        confirmationCode: verificationCode,
      });
      router.push('/'); // window.location.href 대신 router.push 사용
    } catch (error) {
      console.error(error);
      setError('인증에 실패했습니다. 코드를 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsResending(true);

    try {
      await resendSignUpCode({ username: email });
      setSuccessMessage('인증 코드가 이메일로 다시 전송되었습니다.');
    } catch (error) {
      console.error(error);
      setError(
        '인증 코드를 다시 보내는데 실패했습니다. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-black p-4 sm:p-6'>
      <div className='w-full max-w-sm space-y-6'>
        <div className='space-y-2 text-center'>
          <h1 className='text-3xl font-bold text-white'>회원가입</h1>
          <p className='text-muted-foreground'>
            {isSignUpComplete
              ? '이메일로 전송된 인증 코드를 입력해주세요'
              : '새 계정을 만들어 데이로그를 시작하세요'}
          </p>
        </div>

        {!isSignUpComplete ? (
          <div className='space-y-4'>
            <Button variant='outline' className='w-full' disabled={isLoading}>
              GitHub로 회원가입
            </Button>

            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t border-input' />
              </div>
              <div className='relative flex justify-center text-xs'>
                <span className='bg-black px-2 text-muted-foreground'>
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
                <Label htmlFor='password' className='text-gray-300'>
                  비밀번호
                </Label>
                <Input
                  id='password'
                  type='password'
                  placeholder='8자 이상의 비밀번호'
                  minLength={8}
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
                <p className='text-xs text-muted-foreground'>
                  비밀번호는 8자 이상이며, 대문자, 소문자, 숫자, 특수문자를
                  포함해야 합니다.
                </p>
                {passwordError && (
                  <p className='text-xs text-red-400'>{passwordError}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirm-password' className='text-gray-300'>
                  비밀번호 확인
                </Label>
                <Input
                  id='confirm-password'
                  type='password'
                  placeholder='비밀번호 재입력'
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError === '비밀번호가 일치하지 않습니다.') {
                      setPasswordError(null);
                    }
                  }}
                  required
                  disabled={isLoading}
                  className={
                    passwordError === '비밀번호가 일치하지 않습니다.'
                      ? 'border-red-500 focus:border-red-500'
                      : ''
                  }
                />
              </div>

              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? '처리 중...' : '회원가입'}
              </Button>
            </form>

            <div className='text-center text-sm text-muted-foreground'>
              이미 계정이 있으신가요?{' '}
              <Link href='/login' className='text-blue-400'>
                로그인
              </Link>
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            <form onSubmit={handleVerification} className='space-y-4'>
              {error && (
                <div className='p-3 text-sm text-red-400 bg-red-900/30 rounded-md'>
                  {error}
                </div>
              )}

              {successMessage && (
                <div className='p-3 text-sm text-green-400 bg-green-900/30 rounded-md'>
                  {successMessage}
                </div>
              )}

              <div className='space-y-2'>
                <Label htmlFor='verification-code' className='text-gray-300'>
                  인증 코드
                </Label>
                <Input
                  id='verification-code'
                  type='text'
                  placeholder='이메일로 전송된 6자리 코드'
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? '확인 중...' : '인증 완료'}
              </Button>
            </form>

            <div className='text-center text-sm text-gray-400'>
              인증 코드를 받지 못하셨나요?{' '}
              <button
                onClick={handleResendCode}
                className='text-blue-400'
                disabled={isResending}
              >
                {isResending ? '전송 중...' : '코드 재전송'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
