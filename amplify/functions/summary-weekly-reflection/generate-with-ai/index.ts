import OpenAI from 'openai';
import { Logger } from '@aws-lambda-powertools/logger';

const openaiApiKey = process.env.OPENAI_API_KEY;

// Logger 초기화
const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'summary-weekly-reflection-generate-with-ai',
});

interface ReflectionContent {
  userId: string;
  date: string;
  content: string;
}

interface EventDetail {
  userId: string;
  summaryId: string;
  startDate: string;
  endDate: string;
}

interface StepFunctionsEvent {
  detail: EventDetail;
  messageId: string;
  summary: {
    userId: string;
    summaryId: string;
    startDate: string;
    endDate: string;
    review?: string | null;
    createdDate?: string | null;
    updatedDate?: string | null;
  } | null;
  isProcessed: boolean;
  contentItems: {
    userId: string;
    summaryId: string;
    date: string;
    content: string;
    createdDate?: string | null;
    updatedDate?: string | null;
  }[];
  reflectionContents: ReflectionContent[];
}

const guideline = `
당신은 사용자의 일일 회고를 주간 회고로 제공하는 통찰력 있는 유능한 멘토입니다.
멘토로써 가져야 할 마음가짐과 역량은 다음과 같습니다.
 - 조언과 지지를 제공할 수 있는 능력
 - 멘티의 이야기를 잘 들을 수 있는 능력
 - 롤모델이 될 수 있는 능력
 - 유머 감각 능력
 - 개념화 능력
 - 상대를 존중하는 자세
 - 멘티 육성에 대한 무한한 관심

회고는 마크다운 형태이며, 이번 주에 작성한 모든 내용을 담고있습니다. KTP 회고로 정리하여 고객에게 전달해주세요.
첫 문단은 고객이 이번 주 무엇을 했는지 알 수 있도록 모든 회고를 100줄 이내로 요약해주세요.
KPT 회고는 Keep, Problem, Try 섹션으로 나누고 내용은 한 줄로 상세하게 작성해주세요.
마무리로 주간회고에 어울리는 명언을 작성해주세요. 명언이 없다면 작성하지 않습니다.
가장 중요한 것은 예의를 지키며, 고객에게 도움이 되는 내용을 작성하는 것입니다.

출력 예제는 다음과 같습니다:

"""
>{이번주 회고 내용 요약}
## Keep
 - {현재 만족하고 있는 부분}
 - {계속 이어갔으면 하는 부분}
## Problem
 - {불편하게 느낀 부분}
 - {개선이 필요하다고 생각되는 부분}
## Try
 - {Problem에 대한 해결책}
 - {다음 회고 때 판별 가능한 것}
 - {당장 실행가능한 것}

## 오늘의 문장
| {명언}
"""
`;

// 프롬프트 구성
const prompt = (text: string) => `

회고 내용은 다음과 같습니다:

"""
${text}
"""
`;

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

/**
 * OpenAI API를 사용하여 회고 내용을 요약하는 함수
 */
export const handler = async (event: StepFunctionsEvent) => {
  logger.info('Generating AI summary:', {
    event: event,
  });

  if (!openaiApiKey) {
    logger.error('Missing environment variable');
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const { userId, summaryId } = event.detail;
  const { reflectionContents } = event;

  if (!reflectionContents || reflectionContents.length === 0) {
    logger.warn('No reflection contents to summarize', { userId, summaryId });
    return {
      ...event,
      aiSummary: '주간 회고 내용이 없습니다.',
    };
  }

  const startTime = new Date().getTime();

  try {
    // 회고 내용을 텍스트로 변환
    const reflectionText = reflectionContents
      .map((item) => `날짜: ${item.date}\n내용: ${item.content}`)
      .join('\n\n');

    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: guideline,
        },
        {
          role: 'user',
          content: prompt(reflectionText),
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const endTime = new Date().getTime();

    const aiSummary =
      response.choices[0]?.message?.content || '요약을 생성할 수 없습니다.';

    logger.info('Successfully generated AI summary', {
      userId,
      summaryId,
      summaryLength: aiSummary.length,
      duration: endTime - startTime,
    });

    return {
      ...event,
      aiSummary,
    };
  } catch (error) {
    const endTime = new Date().getTime();
    
    logger.error('Error generating AI summary:', {
      error,
      userId,
      summaryId,
      duration: endTime - startTime,
    });
    throw error;
  }
};
