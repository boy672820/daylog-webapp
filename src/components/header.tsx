'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUserAttributes, signOut } from 'aws-amplify/auth';
import { CircleUser, Settings, LogOut } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function Header() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const userAttributes = await fetchUserAttributes();
        setEmail(userAttributes.email || null);
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };

    getUserInfo();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className='border-b border-input bg-black shadow-sm'>
      <div className='container mx-auto max-w-4xl flex h-14 items-center justify-between px-4'>
        <div className='flex items-center gap-6'>
          {/* 사용자 정보만 표시 */}
          {email && (
            <span className='text-sm text-primary font-medium'>{email}</span>
          )}
        </div>

        {/* 사용자 메뉴 */}
        <div className='flex items-center'>
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
                className='w-56 border-gray-800 bg-black text-white'
              >
                <DropdownMenuLabel className='font-normal'>
                  <div className='flex flex-col space-y-1'>
                    <p className='text-sm font-medium leading-none'>사용자</p>
                    <p className='text-xs leading-none text-gray-400'>
                      {email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className='bg-gray-800' />
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
    </header>
  );
}
