'use client';

import { useState, useEffect, useRef } from 'react';
import {
  signIn,
  confirmSignIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  autoSignIn,
} from 'aws-amplify/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { generatePassword } from '../lib/utils';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified') === 'true';
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [authCode, setAuthCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(2);

  const confirmedTypeRef = useRef<'SIGN_IN' | 'SIGN_UP' | null>(null);

  // 검증 완료 메시지 표시
  useEffect(() => {
    if (verified) {
      setSuccessMessage('이메일 인증이 완료되었습니다. 로그인해주세요.');

      // 5초 후 메시지 제거
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [verified]);

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

  // 로그인 성공 후 리다이렉션 카운트다운
  useEffect(() => {
    if (loginSuccess) {
      const timer = setTimeout(() => {
        if (redirectCountdown <= 1) {
          router.push('/calendar');
        } else {
          setRedirectCountdown(redirectCountdown - 1);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [loginSuccess, redirectCountdown, router]);

  // 이메일 유효성 검사 함수
  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const notifyCodeSent = () => {
    setCodeSent(true);
    setSuccessMessage(`인증 코드가 ${email}로 전송되었습니다.`);

    // 60초 재전송 쿨다운 설정
    setResendCooldown(60);

    // 3초 후 성공 메시지 제거
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const signInExist = async () => {
    try {
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password: generatePassword(),
        options: {
          authFlowType: 'USER_AUTH',
          preferredChallenge: 'EMAIL_OTP',
        },
      });

      if (isSignedIn) {
        router.push('/calendar');
        return;
      }

      if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE') {
        confirmedTypeRef.current = 'SIGN_IN';
        notifyCodeSent();
      } else {
        setError(
          '인증 진행 중 문제가 발생하였습니다. 잠시 후 다시 시도해주세요.'
        );
      }
    } catch (error) {
      handleSignException(error);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);

    // 이메일 검증
    if (!validateEmail(email)) {
      setEmailError('유효한 이메일 주소를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const password = generatePassword();
      const { nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: { email },
          autoSignIn: true,
        },
      });

      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        confirmedTypeRef.current = 'SIGN_UP';
        notifyCodeSent();
      } else {
        setError(
          '인증 진행 중 문제가 발생하였습니다. 잠시 후 다시 시도해주세요.'
        );
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'UsernameExistsException') {
        await signInExist();
        return;
      }

      handleSignException(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignException = (error: unknown) => {
    if (error instanceof Error) {
      if (error.name === 'LimitExceededException') {
        setError('요청 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      if (error.message?.includes('network')) {
        setError('네트워크 연결을 확인해주세요.');
        return;
      }
    }

    console.error(error);
    setError(
      '로그인 코드 전송 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
    );
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCodeError(null);

    if (!authCode || authCode.length < 6) {
      setCodeError('유효한 인증 코드를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      if (confirmedTypeRef.current === 'SIGN_IN') {
        const { nextStep } = await confirmSignIn({
          challengeResponse: authCode,
        });

        if (nextStep.signInStep === 'DONE') {
          setLoginSuccess(true);
          setSuccessMessage('로그인 성공! 잠시 후 메인 페이지로 이동합니다.');
        } else {
          setError(
            '추가 인증단계를 완료하지 못했습니다. 관리자에게 문의 부탁드립니다.'
          );
        }
      } else if (confirmedTypeRef.current === 'SIGN_UP') {
        const { nextStep } = await confirmSignUp({
          username: email,
          confirmationCode: authCode,
        });

        if (nextStep.signUpStep === 'COMPLETE_AUTO_SIGN_IN') {
          await autoSignIn();
          setLoginSuccess(true);
          setSuccessMessage(
            '회원가입 및 로그인 성공! 잠시 후 메인 페이지로 이동합니다.'
          );
        } else {
          setError(
            '추가 인증단계를 완료하지 못했습니다. 관리자에게 문의 부탁드립니다.'
          );
        }
      } else {
        setError('이메일 인증 코드를 발송하지 않았습니다. 다시 확인해주세요.');
      }
    } catch (error) {
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAuthorizedException':
            setCodeError(
              '인증 시간이 만료되었습니다. 인증 코드를 다시 전송해주세요.'
            );
            break;
          case 'CodeMismatchException':
            setCodeError('인증 코드가 일치하지 않습니다. 다시 확인해주세요.');
            break;
          case 'ExpiredCodeException':
            setCodeError(
              '인증 코드가 만료되었습니다. 새로운 코드를 요청해주세요.'
            );
            break;
          default:
            setError('인증 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
            break;
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setError(null);
    setIsLoading(true);

    try {
      if (confirmedTypeRef.current === 'SIGN_IN') {
        await signIn({
          username: email,
          options: {
            authFlowType: 'USER_AUTH',
            preferredChallenge: 'EMAIL_OTP',
          },
        });
      } else if (confirmedTypeRef.current === 'SIGN_UP') {
        await resendSignUpCode({ username: email });
      } else {
        throw new Error('이메일 OTP 발송 단계를 실시하지 않았습니다.');
      }

      setSuccessMessage(`인증 코드가 ${email}로 재전송되었습니다.`);
      setResendCooldown(60);

      // 3초 후 성공 메시지 제거
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'LimitExceededException') {
          setError('요청 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요.');
        } else {
          console.error(error);
          setError('인증 코드 재전송 중 문제가 발생했습니다.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setCodeSent(false);
    setAuthCode('');
    setCodeError(null);
    setError(null);
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
          {successMessage && (
            <div
              className={`p-3 text-sm ${
                loginSuccess
                  ? 'text-green-400 bg-green-900/30'
                  : 'text-green-400 bg-green-900/30'
              } rounded-md`}
            >
              {successMessage}
            </div>
          )}

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t bg-accent' />
            </div>
            <div className='relative flex justify-center text-xs'>
              <span className='bg-black px-2'>이메일로 계속하기</span>
            </div>
          </div>

          {!codeSent ? (
            <form onSubmit={handleEmailSubmit} className='space-y-4'>
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
                <p className='text-xs text-muted-foreground'>
                  로그인을 위한 인증 코드가 이메일로 전송됩니다.
                </p>
              </div>

              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? (
                  <span className='flex items-center justify-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    인증 코드 전송 중...
                  </span>
                ) : (
                  '인증 코드 전송하기'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className='space-y-4'>
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
                  value={email}
                  disabled
                  className='bg-gray-800'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='authCode' className='text-gray-300'>
                  인증 코드
                </Label>
                <Input
                  id='authCode'
                  type='text'
                  placeholder={
                    confirmedTypeRef.current === 'SIGN_UP'
                      ? '인증 코드 6자리'
                      : '인증 코드 8자리'
                  }
                  value={authCode}
                  onChange={(e) => {
                    setAuthCode(e.target.value);
                    setCodeError(null);
                  }}
                  required
                  disabled={isLoading}
                  className={
                    codeError ? 'border-red-500 focus:border-red-500' : ''
                  }
                />
                {codeError && (
                  <p className='text-xs text-red-400'>{codeError}</p>
                )}
              </div>

              <div className='space-y-2'>
                {loginSuccess ? (
                  <Button
                    className='w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2'
                    disabled
                  >
                    <CheckCircle2 className='h-5 w-5' />
                    <span>로그인 완료 ({redirectCountdown}초 후 이동)</span>
                  </Button>
                ) : (
                  <Button type='submit' className='w-full' disabled={isLoading}>
                    {isLoading ? (
                      <span className='flex items-center justify-center gap-2'>
                        <Loader2 className='h-4 w-4 animate-spin' />
                        로그인 중...
                      </span>
                    ) : (
                      '로그인'
                    )}
                  </Button>
                )}

                {!loginSuccess && (
                  <div className='flex justify-between'>
                    <Button
                      type='button'
                      variant='ghost'
                      onClick={handleBack}
                      disabled={isLoading}
                      className='text-sm'
                    >
                      이메일 변경
                    </Button>

                    <Button
                      type='button'
                      variant='ghost'
                      onClick={handleResendCode}
                      disabled={isLoading || resendCooldown > 0}
                      className='text-sm'
                    >
                      {isLoading && resendCooldown === 0 ? (
                        <span className='flex items-center gap-1'>
                          <Loader2 className='h-3 w-3 animate-spin' />
                          전송 중...
                        </span>
                      ) : resendCooldown > 0 ? (
                        `재전송 (${resendCooldown}초 후 가능)`
                      ) : (
                        '인증 코드 재전송'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
