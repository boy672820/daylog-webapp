'use client';

import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { Badge } from './ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { cn } from '@/lib/utils';

interface HeaderComboProps {
  currentStreak: number;
  longestStreak: number;
  lastReflectionDate: Date | null;
  className?: string;
  showDetails?: boolean;
}

export function HeaderCombo({
  currentStreak,
  longestStreak,
  lastReflectionDate,
  className,
  showDetails = true,
}: HeaderComboProps) {
  const [showSparkles, setShowSparkles] = useState(false);
  
  // 파티클 효과를 위한 상태, 콤보가 10 이상이면 가끔 파티클 애니메이션 표시
  useEffect(() => {
    if (currentStreak >= 10) {
      const interval = setInterval(() => {
        setShowSparkles(true);
        setTimeout(() => setShowSparkles(false), 2000);
      }, 10000); // 10초마다 파티클 효과
      
      return () => clearInterval(interval);
    }
  }, [currentStreak]);

  // 콤보 수에 따른 색상 및 스타일 결정
  const getComboStyle = () => {
    if (currentStreak >= 30) {
      return {
        bgClass: 'bg-gradient-to-r from-purple-600 to-pink-600',
        hoverClass: 'hover:from-purple-700 hover:to-pink-700',
        emoji: '🔥🔥🔥',
        pulseEffect: true
      };
    } else if (currentStreak >= 14) {
      return {
        bgClass: 'bg-gradient-to-r from-red-500 to-orange-500',
        hoverClass: 'hover:from-red-600 hover:to-orange-600',
        emoji: '🔥🔥',
        pulseEffect: true
      };
    } else if (currentStreak >= 7) {
      return {
        bgClass: 'bg-gradient-to-r from-orange-500 to-amber-500',
        hoverClass: 'hover:from-orange-600 hover:to-amber-600',
        emoji: '🔥',
        pulseEffect: false
      };
    } else {
      return {
        bgClass: 'bg-orange-600',
        hoverClass: 'hover:bg-orange-700',
        emoji: '',
        pulseEffect: false
      };
    }
  };

  const style = getComboStyle();
  
  if (currentStreak === 0) {
    return null;
  }

  const comboDisplay = (
    <Badge 
      className={cn(
        'flex items-center gap-1 px-2.5 py-1 shadow-lg border border-transparent', 
        style.bgClass, 
        style.hoverClass,
        style.pulseEffect && 'animate-pulse',
        className
      )}
    >
      <Flame className={cn(
        'h-3.5 w-3.5',
        currentStreak >= 7 && 'animate-bounce'
      )} />
      <span className='text-xs font-bold tracking-wide'>
        {currentStreak}일 연속 
        {style.emoji && <span className="ml-1">{style.emoji}</span>}
      </span>
    </Badge>
  );

  // 스파클 파티클 효과 (콤보가 높을 때 가끔 표시)
  const renderSparkles = showSparkles && currentStreak >= 10 && (
    <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping" />
      <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-orange-300 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
      <div className="absolute top-0 right-1 w-1 h-1 bg-red-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
    </div>
  );

  if (!showDetails) {
    return (
      <div className="relative">
        {comboDisplay}
        {renderSparkles}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='flex items-center gap-1.5 cursor-help relative'>
            {comboDisplay}
            {renderSparkles}
            
            {/* 최고 기록 갱신시 배지 */}
            {currentStreak >= longestStreak && longestStreak > 0 && (
              <span className="text-xs px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded-md font-medium animate-pulse">
                최고기록!
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-3 bg-gray-900 border-gray-800">
          <div className='space-y-2'>
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-400" />
              <h4 className='font-medium text-sm'>현재 {currentStreak}일 연속 작성 중!</h4>
            </div>
            
            <div className="space-y-1 mt-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">최장 기록</span>
                <span className={cn(
                  'font-semibold',
                  currentStreak >= longestStreak ? 'text-blue-400' : 'text-white'
                )}>
                  {longestStreak}일
                  {currentStreak >= longestStreak && ' (갱신 중!)'}
                </span>
              </div>
              
              {lastReflectionDate && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">마지막 회고</span>
                  <span className="text-gray-200">
                    {new Date(lastReflectionDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            
            {/* 콤보에 따른 동기부여 메시지 */}
            <div className="text-xs px-2 py-1.5 bg-gray-800/50 rounded text-gray-300 italic">
              {currentStreak >= 30 ? (
                "대단해요! 30일 이상의 놀라운 습관을 만들었습니다!"
              ) : currentStreak >= 14 ? (
                "훌륭해요! 2주 연속 회고를 통해 성장하고 있습니다."
              ) : currentStreak >= 7 ? (
                "잘하고 있어요! 일주일 연속 회고로 습관을 만들어가세요."
              ) : (
                "좋은 시작이에요! 꾸준히 회고를 작성해보세요."
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
