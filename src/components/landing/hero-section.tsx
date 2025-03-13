import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-gray-950 py-20">
      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-500 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-purple-500 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              매일의 <span className="text-blue-600 dark:text-blue-400">회고</span>로<br />
              더 나은 <span className="text-purple-600 dark:text-purple-400">내일</span>을 만들어요
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto lg:mx-0">
              데이로그는 하루에 한 번씩 회고를 작성하고, 일주일마다 AI가 분석하여 
              당신의 성장을 돕는 지능형 회고 서비스입니다.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button href="/signup" size="lg" className="text-base">
                무료로 시작하기
              </Button>
              <Button href="/login" variant="outline" size="lg" className="text-base">
                로그인
              </Button>
            </div>
            
            <div className="mt-8 flex items-center justify-center lg:justify-start">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700" />
                ))}
              </div>
              <p className="ml-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold">1,000+</span> 사용자가 데이로그와 함께 성장하고 있어요
              </p>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative z-10 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-blue-600 dark:text-blue-300"
                    >
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold">오늘의 회고</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2025년 3월 13일</p>
                  </div>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                  일일 회고
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">오늘 가장 의미 있었던 일은 무엇인가요?</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    새로운 프로젝트를 시작했습니다. 팀원들과 함께 아이디어를 나누고 계획을 세우는 과정이 즐거웠습니다.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">내일은 무엇을 개선하고 싶나요?</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    시간 관리를 더 효율적으로 하고 싶습니다. 중요한 일에 집중할 수 있도록 우선순위를 정확히 설정해야겠습니다.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button className="text-sm text-blue-600 dark:text-blue-400 font-medium">저장하기</button>
              </div>
            </div>
            
            {/* 장식 요소 */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-100 dark:bg-purple-900 rounded-lg -z-10 transform rotate-6"></div>
            <div className="absolute -top-6 -left-6 w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-lg -z-10 transform -rotate-12"></div>
          </div>
        </div>
      </div>
    </section>
  );
}