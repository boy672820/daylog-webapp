import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { format, subDays, getISOWeek, getISOWeekYear } from 'date-fns';
import { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';
import { v4 as uuid } from 'uuid';
import { fetchAuthSession, signIn } from 'aws-amplify/auth';

/**
 * 테스트 데이터 생성 스크립트
 *
 * 실행 방법:
 * 1. IAM 인증 사용: AUTH_MODE=iam ts-node scripts/seed-test-summary.ts
 * 2. API 키 인증 사용: AUTH_MODE=apiKey API_KEY=your-api-key ts-node scripts/seed-test-summary.ts
 * 3. Cognito 사용자 인증 사용: AUTH_MODE=userPool ADMIN_USERNAME=admin@example.com ADMIN_PASSWORD=password ts-node scripts/seed-test-summary.ts
 */

// 인증 방식 선택 (환경 변수로 설정 가능)
const AUTH_MODE = process.env.AUTH_MODE || 'apiKey'; // 'iam', 'userPool', 'apiKey'

console.log(`Using authentication mode: ${AUTH_MODE}`);

// Amplify 기본 설정
Amplify.configure(outputs);

// 기본 인증 타입 확인
console.log(
  'Default authorization type:',
  outputs.data.default_authorization_type
);
console.log('Available authorization types:', outputs.data.authorization_types);

// 인증 규칙 정보 출력
console.log('\nAuthorization rules for Summary model:');
console.log(
  "- Owner-based authorization: allow.owner().to(['read', 'create', 'update'])"
);
console.log('Schema-level authorization includes: allow.publicApiKey()');

// 클라이언트 타입 정의
type AmplifyClient = ReturnType<typeof generateClient<Schema>>;

// 인증 모드에 따른 클라이언트 생성
let client: AmplifyClient;

// 관리자 계정으로 로그인하는 함수 (Cognito 사용자 풀 인증 사용 시)
async function signInAsAdmin(): Promise<boolean> {
  try {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;

    if (!username || !password) {
      console.error(
        'Admin credentials not provided. Set ADMIN_USERNAME and ADMIN_PASSWORD environment variables.'
      );
      return false;
    }

    console.log(`Attempting to sign in as admin user: ${username}`);

    await signIn({
      username,
      password,
    });

    // 세션 확인
    const session = await fetchAuthSession();
    const isAuthenticated = session.tokens !== undefined;
    console.log('Authentication successful:', isAuthenticated);

    return isAuthenticated;
  } catch (error) {
    console.error('Failed to sign in:', error);
    return false;
  }
}

// 인증 모드에 따라 클라이언트 초기화
async function initializeClient(): Promise<AmplifyClient | null> {
  if (AUTH_MODE === 'iam') {
    console.log('Using IAM authentication');
    return generateClient<Schema>({
      authMode: 'identityPool',
    });
  } else if (AUTH_MODE === 'userPool') {
    console.log('Using Cognito User Pool authentication');
    const isAuthenticated = await signInAsAdmin();
    if (!isAuthenticated) {
      console.error('Failed to authenticate with Cognito User Pool');
      return null;
    }
    return generateClient<Schema>({
      authMode: 'userPool',
    });
  } else if (AUTH_MODE === 'apiKey') {
    console.log('Using API Key authentication');
    return generateClient<Schema>({
      authMode: 'apiKey',
    });
  } else {
    console.log('Using default authentication');
    return generateClient<Schema>();
  }
}

// 클라이언트 초기화 및 데이터 생성 실행
async function initialize() {
  const apiClient = await initializeClient();
  if (!apiClient) {
    console.error('Failed to initialize API client');
    process.exit(1);
  }

  client = apiClient;
  await seedTestData();
}

// 스크립트 시작
initialize().catch((error) => {
  console.error('Error initializing:', error);
  process.exit(1);
});

const sampleContents = [
  `> 오늘은 집중력이 바닥이었다.  

아침부터 뭔가 집중이 잘 안 된다. 해야 할 게 많긴 한데, 손에 잡히질 않는다.  
자꾸 다른 거에 신경이 분산되고, 멍하니 시간을 날려버렸다.  

## 원인 분석  
- 잠을 충분히 못 잤다. (4시간 수면)  
- 오전에 커피를 너무 늦게 마셨다.  
- 딱히 급한 일이 없다고 느껴서 긴장감이 부족했다.  

## 해결책  
- 오늘은 일찍 자자.  
- 오전 루틴을 확실히 정해서 시작하자.  
- 급한 일이 없어도 해야 할 일을 정리해서 스스로 동기 부여하기.  
`,
  `> 오늘은 만족스러운 하루였다!  

하루 종일 해야 할 일들을 끝냈다. 생산적인 하루를 보낸 기분이 들었다.  
특히 사이드 프로젝트에서 기능 하나를 완성했는데, 오랜만에 ‘완료’라는 느낌을 받아서 기분이 좋다.  

## 오늘의 성과  
✅ 사이드 프로젝트 로그인 기능 완성  
✅ 운동 1시간 (헬스장)  
✅ 미뤄뒀던 책 30페이지 읽기  

## 내일의 목표  
1. API 성능 개선하기  
2. 운동 1시간 유지하기  
3. 새로운 기술 블로그 하나 읽기  
`,
  `> 멘탈이 흔들리는 하루였다.  

오늘 아침에 면접에서 탈락했다는 메일을 받았다. 사실 기대를 안 했다고 생각했는데, 막상 결과를 받으니까 기분이 별로다.  
이제 몇 번째 탈락인지 모르겠다. 나는 정말 부족한 걸까?  

## 생각 정리  
- 이직은 운도 작용한다. 나만 그런 게 아니다.  
- 부족한 부분이 있다면 채워나가면 된다.  
- 다음에는 더 잘 준비하자.  

## 다음 액션  
🔹 이력서 다시 점검하기  
🔹 CS 기본 지식 다시 복습하기  
🔹 새로운 기회 찾아보기  
`,
  `> 해야 할 게 너무 많다.  

오늘은 정말 정신없이 하루를 보냈다. 회사 일, 공부, 개인 프로젝트까지 다 하려고 하니까 너무 벅차다.  
무리하게 계획을 짠 것 같다.  

## 문제점  
- 일정이 과하게 빡빡하다.  
- 집중력이 분산되어서 효율이 낮다.  
- 쉬는 시간이 거의 없다.  

## 해결책  
✔ 우선순위를 다시 정리하기  
✔ 하루에 하나씩만 완벽하게 끝내기  
✔ 최소한 30분씩은 쉬는 시간을 가지기  
`,
  `> 컨디션 최고! 효율적인 하루.  

오늘은 이상할 정도로 집중이 잘 되었다.  
오전에 3시간 동안 쉬지 않고 개발을 했는데도 피곤하지 않았다.  
오후에는 운동까지 마치고, 집에 와서도 책을 읽으며 하루를 마무리했다.  

## 왜 잘 되었을까?  
- 전날 숙면 (7시간 이상 수면)  
- 오전에 일찍 일어나서 바로 업무 시작  
- 작업 환경을 정리해서 산만함이 적었다.  

## 앞으로도 유지할 것  
🌟 7시간 이상 자기  
🌟 아침에 루틴 만들기  
🌟 일하는 공간을 정리하기  
`,
  `> 의미 있는 대화를 나눴다.  

오늘은 회사 동료와 진지한 대화를 나눴다.  
요즘 내가 고민하고 있는 일들에 대해서 얘기했는데, 예상치 못한 조언을 들었다.  
가끔은 내 생각에 너무 갇혀서 판단을 제대로 못 하는 것 같다.  

## 배운 점  
💡 다른 사람의 시각을 듣는 것이 중요하다.  
💡 혼자 고민하는 것보다 공유하는 것이 해결책을 빠르게 찾는 길일 수도 있다.  
💡 나도 누군가에게 도움이 될 수 있도록 적극적으로 소통해보자.  

## 내일의 다짐  
👉 팀원과 더 많은 피드백 주고받기  
👉 오픈 마인드 유지하기  
`,
];

// 현재 날짜 기준 이전 날짜 계산 함수
function getPastDate(daysAgo: number): Date {
  return subDays(new Date(), daysAgo);
}

// 주차 ID 생성 함수 (W#YYYY#WW 형식)
function generateWeekId(date: Date): string {
  const isoYear = getISOWeekYear(date);
  const isoWeek = String(getISOWeek(date)).padStart(2, '0');
  return `W#${isoYear}#${isoWeek}`;
}

// 날짜 범위 계산 함수 (월요일~일요일)
function calculateWeekRange(date: Date): { startDate: Date; endDate: Date } {
  const day = date.getDay();
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - (day === 0 ? 6 : day - 1));

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return { startDate, endDate };
}

// Summary 생성 함수
async function createSummary(weekOffset: number): Promise<{
  summaryId: string;
  userId: string;
  startDate: string;
  endDate: string;
}> {
  // 주차별 날짜 계산
  const baseDate = getPastDate(weekOffset * 7);
  const { startDate, endDate } = calculateWeekRange(baseDate);
  const summaryId = generateWeekId(baseDate);

  const formattedStartDate = format(startDate, 'yyyy-MM-dd');
  const formattedEndDate = format(endDate, 'yyyy-MM-dd');

  console.log(
    `Creating Summary for week ${summaryId} (${formattedStartDate} ~ ${formattedEndDate})`
  );

  const userId = uuid();

  try {
    const { errors } = await client.models.Summary.create({
      userId,
      summaryId,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      review: '',
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    });

    if (errors) {
      console.error(`Error creating Summary for week ${summaryId}:`, errors);
      throw new Error('Failed to create Summary');
    }

    return {
      summaryId,
      userId,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
    };
  } catch (error) {
    console.error(`Error creating Summary for week ${summaryId}:`, error);
    throw error;
  }
}

// SummaryContent 생성 함수
async function createSummaryContents(
  summaryId: string,
  userId: string,
  startDate: string,
  endDate: string
): Promise<void> {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // 해당 주의 모든 날짜에 대해 SummaryContent 생성
  for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayIndex =
      Math.floor((day.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    console.log(`Creating SummaryContent for date ${dateStr}`);

    try {
      // SummaryContent 생성
      const { errors } = await client.models.SummaryContent.create({
        userId,
        summaryId,
        date: dateStr,
        content: sampleContents[dayIndex % sampleContents.length],
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      });

      if (errors) {
        console.error(`Error creating data for date ${dateStr}:`, errors);
        throw new Error('Failed to create SummaryContent');
      }
    } catch (error) {
      console.error(`Error creating data for date ${dateStr}:`, error);
      // 계속 진행
    }
  }
}

// 메인 함수: 3주치 데이터 생성
async function seedTestData(): Promise<void> {
  console.log('Starting test data generation...');

  for (let i = 0; i < 100; i++) {
    // 최근 3주의 데이터 생성
    for (let weekOffset = 0; weekOffset < 3; weekOffset++) {
      try {
        // Summary 생성
        const { summaryId, userId, startDate, endDate } = await createSummary(
          weekOffset
        );

        // SummaryContent 생성
        await createSummaryContents(summaryId, userId, startDate, endDate);

        console.log(`Completed data generation for week ${weekOffset + 1}/3`);
      } catch (error) {
        console.error(
          `Failed to generate data for week ${weekOffset + 1}:`,
          error
        );
        // 다음 주차로 계속 진행
      }
    }
  }

  console.log('Test data generation completed successfully!');
}
