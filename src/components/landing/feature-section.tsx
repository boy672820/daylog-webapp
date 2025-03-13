import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function FeatureSection() {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">데이로그의 주요 기능</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            데이로그는 당신의 일상을 기록하고 성장할 수 있도록 도와주는 서비스입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 기능 1: 일일 회고 */}
          <Card className="flex flex-col h-full">
            <CardHeader>
              <div className="mb-4 flex justify-center">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
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
                    className="text-blue-600 dark:text-blue-300"
                  >
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </div>
              </div>
              <CardTitle className="text-center">일일 회고 작성</CardTitle>
              <CardDescription className="text-center">
                하루에 한 번씩 자신의 생각과 경험을 기록하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-gray-600 dark:text-gray-400">
                데이로그는 매일 자신의 하루를 돌아보고 기록할 수 있는 공간을 제공합니다. 
                간단한 질문들을 통해 하루를 효과적으로 정리하고 의미 있는 회고를 작성할 수 있습니다.
              </p>
            </CardContent>
          </Card>

          {/* 기능 2: 주간 요약 */}
          <Card className="flex flex-col h-full">
            <CardHeader>
              <div className="mb-4 flex justify-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
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
                    className="text-green-600 dark:text-green-300"
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                </div>
              </div>
              <CardTitle className="text-center">주간 요약 및 분석</CardTitle>
              <CardDescription className="text-center">
                일주일간의 회고를 취합하여 요약해드립니다
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-gray-600 dark:text-gray-400">
                일주일 동안 작성한 회고를 AI가 분석하여 핵심 주제와 패턴을 찾아냅니다.
                당신의 일주일을 한눈에 파악하고, 중요한 인사이트를 발견할 수 있습니다.
              </p>
            </CardContent>
          </Card>

          {/* 기능 3: 성장 피드백 */}
          <Card className="flex flex-col h-full">
            <CardHeader>
              <div className="mb-4 flex justify-center">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
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
                    className="text-purple-600 dark:text-purple-300"
                  >
                    <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"></path>
                    <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"></path>
                  </svg>
                </div>
              </div>
              <CardTitle className="text-center">맞춤형 성장 피드백</CardTitle>
              <CardDescription className="text-center">
                개인화된 피드백으로 성장 기회를 제공합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-gray-600 dark:text-gray-400">
                데이로그는 당신의 회고 내용을 바탕으로 맞춤형 피드백을 제공합니다.
                자신의 강점과 개선점을 파악하고, 더 나은 내일을 위한 실질적인 조언을 받을 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}