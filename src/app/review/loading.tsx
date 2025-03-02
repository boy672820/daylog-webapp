import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-black'>
      <div className='flex flex-col items-center space-y-4'>
        <Loader2 className='h-10 w-10 animate-spin text-primary' />
        <p className='text-muted-foreground'>회고 페이지를 불러오는 중...</p>
      </div>
    </div>
  );
}
