# Daylog 프로젝트 개요

## 프로젝트 목적
Daylog는 사용자가 매일 작성한 회고를 기반으로 AI가 내용을 정리해주는 웹 애플리케이션입니다. 정리는 주간으로 진행되며 주간 회고록을 만들어 평가가 이루어집니다. 이를 통해 사용자는 자신의 생각과 경험을 체계적으로 정리하고, 의미 있는 인사이트를 얻을 수 있습니다.

## 핵심 기능
1. **일일 회고 작성 및 관리**
   - 리치 텍스트 에디터를 통한 다양한 서식 지원
   - 자동 저장 기능
   - 시간 제약 기반 접근 (오후 6시 이후 작성 가능)

2. **캘린더 기반 회고 탐색**
   - 직관적인 캘린더 인터페이스
   - 회고 작성 현황 시각화
   - 날짜별 회고 내용 접근

3. **AI를 활용한 주간 회고 자동 요약**
   - 일주일 동안의 회고 내용 분석
   - 주요 주제 및 키워드 추출
   - 의미 있는 인사이트 제공

4. **사용자별 연속 작성 기록(Streak) 관리**
   - 연속 작성일 추적 및 시각화
   - 최장 연속 작성 기록 관리
   - 동기부여 요소 제공

5. **회고 내용 검색 및 조회**
   - 키워드 기반 검색
   - 날짜 범위 기반 조회
   - 주제별 필터링

## 기술 스택
- **프론트엔드**:
  - Next.js 14 (App Router)
  - React 18
  - TypeScript
  - Tailwind CSS
  - Tiptap (리치 텍스트 에디터)
  - date-fns (날짜 처리)
  - react-day-picker (캘린더 컴포넌트)

- **백엔드**:
  - AWS Amplify Gen2
  - AWS Lambda
  - Amazon DynamoDB
  - AWS Cognito (인증)
  - AWS EventBridge
  - AWS SQS

- **AI 서비스**:
  - OpenAI API (GPT 모델)

- **개발 도구**:
  - TypeScript
  - ESLint
  - Prettier
  - AWS CDK

## 시스템 아키텍처
Daylog는 이벤트 기반의 서버리스 아키텍처를 채택하여 확장성과 유지보수성을 높였습니다.

### 프론트엔드 아키텍처
- Next.js App Router를 사용한 하이브리드 렌더링
- 서버 컴포넌트와 클라이언트 컴포넌트의 명확한 분리
- Tiptap 기반의 확장 가능한 리치 텍스트 에디터
- 반응형 디자인으로 다양한 디바이스 지원

### 백엔드 아키텍처
1. **데이터 저장 및 접근**
   - DynamoDB 테이블: Daily, Summary, SummaryContent, Streak
   - 복합 키 모델링을 통한 효율적인 데이터 접근
   - 소유자 기반 권한 모델 적용

2. **이벤트 처리 흐름**
   - 사용자가 일일 회고 작성/수정 → DynamoDB 저장
   - DynamoDB Stream → dynamoDBStreamDaily Lambda 트리거
   - 'DailyModified' 이벤트 발행 → dailyConsumer Lambda 트리거
   - SummaryContent 생성/업데이트
   - 주기적으로 'DailySummarized' 이벤트 발행
   - OpenAI API 호출 → 주간 요약 생성 및 저장

3. **인증 및 권한**
   - AWS Cognito를 통한 사용자 인증
   - 클라이언트 측: useAuthSession 훅
   - 서버 측: AuthGetCurrentUserServer 함수
   - 소유자 기반 데이터 접근 제어

## 데이터 모델
- **User**: 사용자 정보
  - email, password

- **Daily**: 일일 회고 내용
  - userId, date, content, createdDate, updatedDate

- **Summary**: 주간/월간/분기별 요약
  - userId, summaryId, review, startDate, endDate, createdDate, updatedDate

- **SummaryContent**: 요약의 세부 내용
  - summaryId, userId, date, content, createdDate, updatedDate

- **Streak**: 사용자의 연속 작성 정보
  - userId, currentStreak, longestStreak, lastDate, streakHistory, updatedDate

## 주요 구현 패턴
1. **이벤트 기반 아키텍처**: EventBridge, Lambda를 활용한 느슨한 결합
2. **서버리스 아키텍처**: AWS 관리형 서비스를 활용한 확장성 확보
3. **하이브리드 렌더링**: 서버 컴포넌트와 클라이언트 컴포넌트의 적절한 조합
4. **복합 키 모델링**: DynamoDB의 특성을 활용한 효율적인 데이터 접근
5. **데이터 변환 패턴**: HTML → Markdown 변환을 통한 AI 처리 최적화

## 현재 개발 상태
프로젝트는 현재 개발 중이며, 다음 기능들이 구현되어 있습니다:
- 사용자 인증 시스템
- 일일 회고 작성 및 조회 기능
- 캘린더 인터페이스
- 이벤트 기반 데이터 처리 시스템

진행 중인 작업:
- 주간 요약 생성 기능 (OpenAI API 통합)
- 연속 작성 기록(Streak) 시스템
- 모바일 최적화

## 향후 계획
- AI 요약 기능 고도화
- 사용자 피드백 시스템 구현
- 데이터 분석 및 인사이트 기능 개발
- 커뮤니티 기능 추가
- 팀 협업 기능 개발