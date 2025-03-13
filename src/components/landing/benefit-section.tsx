import { Button } from '@/components/ui/button';

export function BenefitSection() {
  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">데이로그와 함께 성장하세요</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            데이로그는 단순한 일기장이 아닌, 당신의 성장을 돕는 동반자입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">자기 성찰의 습관화</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  매일 일정한 시간에 자신을 돌아보는 습관을 형성하여 자기 성찰 능력을 키울 수 있습니다.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2v4"></path>
                    <path d="M12 18v4"></path>
                    <path d="m4.93 4.93 2.83 2.83"></path>
                    <path d="m16.24 16.24 2.83 2.83"></path>
                    <path d="M2 12h4"></path>
                    <path d="M18 12h4"></path>
                    <path d="m4.93 19.07 2.83-2.83"></path>
                    <path d="m16.24 7.76 2.83-2.83"></path>
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">패턴 발견과 인사이트</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  주간 요약을 통해 자신의 생각과 행동 패턴을 발견하고, 새로운 인사이트를 얻을 수 있습니다.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">지속적인 성장</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  맞춤형 피드백을 통해 자신의 강점을 강화하고 약점을 개선하여 지속적인 성장을 이룰 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-4 text-center">지금 바로 시작하세요</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
              데이로그와 함께 매일의 성장을 기록하고, 더 나은 내일을 만들어보세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/signup" size="lg">
                무료로 시작하기
              </Button>
              <Button href="/login" variant="outline" size="lg">
                로그인
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}