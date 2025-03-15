# 시스템 패턴

이 문서는 Daylog 프로젝트에서 사용되는 주요 시스템 패턴, 아키텍처 패턴, 코드 패턴 등을 기록합니다.

## 아키텍처 패턴

### 이벤트 기반 아키텍처 (Event-Driven Architecture)
Daylog는 이벤트 기반 아키텍처를 채택하여 시스템 컴포넌트 간의 느슨한 결합을 구현합니다.

- **구현 방식**: AWS EventBridge, SQS, Lambda를 활용
- **주요 이벤트 흐름**:
  1. 사용자가 일일 회고 작성/수정 → DynamoDB 저장 → DynamoDB Stream 이벤트 발생
  2. DynamoDB Stream → dynamoDBStreamDaily Lambda 트리거 → 'DailyModified' 이벤트 발행
  3. 'DailyModified' 이벤트 → dailyConsumer Lambda 트리거 → SummaryContent 생성/업데이트
  4. EventBridge 스케줄러 → summarizeDailes 뮤테이션 트리거 → 'DailySummarized' 이벤트 발행
  5. 'DailySummarized' 이벤트 → OpenAI API 호출 Lambda 트리거 → 주간 요약 생성 및 저장

- **장점**:
  - 시스템 컴포넌트 간 느슨한 결합
  - 비동기 처리를 통한 확장성 확보
  - 장애 격리 및 복원력 향상

### 서버리스 아키텍처 (Serverless Architecture)
AWS Lambda와 관리형 서비스를 활용하여 서버리스 아키텍처를 구현합니다.

- **주요 구성 요소**:
  - AWS Amplify Gen2: 프론트엔드 및 백엔드 통합
  - AWS Lambda: 비즈니스 로직 처리
  - DynamoDB: 데이터 저장
  - EventBridge: 이벤트 관리
  - SQS: 메시지 큐잉

- **장점**:
  - 인프라 관리 부담 감소
  - 사용량에 따른 자동 확장
  - 비용 효율성

### Next.js 서버 컴포넌트 아키텍처
Next.js의 App Router와 서버 컴포넌트를 활용하여 하이브리드 렌더링 아키텍처를 구현합니다.

- **구현 방식**:
  - 서버 컴포넌트: 데이터 페칭 및 초기 렌더링 (src/app/daily/page.tsx, src/app/calendar/page.tsx)
  - 클라이언트 컴포넌트: 인터랙티브 UI 요소 ('use client' 지시문 사용)

- **장점**:
  - 서버 측 렌더링을 통한 초기 로딩 성능 향상
  - 클라이언트 번들 크기 감소
  - SEO 최적화

## 데이터 패턴

### 복합 키 모델링 (Composite Key Modeling)
DynamoDB의 특성을 활용한 복합 키 모델링 패턴을 적용합니다.

- **구현 방식**:
  - Daily 모델: userId(PK) + date(SK)
  - Summary 모델: summaryId(PK) + userId(SK)
  - SummaryContent 모델: summaryId(PK) + userId(SK) + date(추가 식별자)

- **장점**:
  - 효율적인 데이터 액세스 패턴 지원
  - 관계형 데이터 모델링 가능
  - 쿼리 성능 최적화

### 이벤트 소싱 패턴 (Event Sourcing)
상태 변경을 이벤트로 기록하고 처리하는 이벤트 소싱 패턴을 부분적으로 적용합니다.

- **구현 방식**:
  - DynamoDB 스트림을 통한 변경 이벤트 캡처
  - EventBridge를 통한 이벤트 발행 및 구독
  - Lambda 함수를 통한 이벤트 처리

- **장점**:
  - 상태 변경 이력 추적 가능
  - 시스템 확장성 향상
  - 비동기 처리를 통한 성능 최적화

### 데이터 변환 패턴 (Data Transformation)
HTML 콘텐츠를 Markdown으로 변환하여 AI 처리에 최적화하는 데이터 변환 패턴을 적용합니다.

- **구현 방식**:
  - Turndown 라이브러리를 사용하여 HTML → Markdown 변환
  - 변환된 데이터를 SummaryContent 테이블에 저장

- **장점**:
  - AI 처리에 적합한 형식으로 데이터 준비
  - 저장 공간 최적화
  - 처리 효율성 향상

## 프론트엔드 패턴

### 컴포넌트 기반 아키텍처
React와 Next.js를 활용한 컴포넌트 기반 아키텍처를 구현합니다.

- **주요 컴포넌트 구조**:
  - 페이지 컴포넌트 (src/app): 라우팅 및 데이터 페칭
  - 기능 컴포넌트 (src/components): 재사용 가능한 UI 컴포넌트
  - UI 컴포넌트 (src/components/ui): 기본 UI 요소
  - 에디터 컴포넌트 (src/components/tiptap): 리치 텍스트 에디터

- **장점**:
  - 코드 재사용성 향상
  - 관심사 분리
  - 유지보수성 향상

### 커스텀 훅 패턴
React 훅을 활용하여 로직을 재사용 가능한 단위로 분리합니다.

- **주요 커스텀 훅**:
  - useAuthSession: 인증 상태 관리
  - useDebounce: 입력 디바운싱
  - useImageUpload: 이미지 업로드 처리
  - useMediaQuery: 반응형 디자인 지원

- **장점**:
  - 로직 재사용성 향상
  - 관심사 분리
  - 테스트 용이성

### 리치 텍스트 에디터 패턴
Tiptap 라이브러리를 기반으로 확장 가능한 리치 텍스트 에디터를 구현합니다.

- **구현 방식**:
  - 확장 기반 아키텍처 (StarterKit, TextAlign, Color 등)
  - 플로팅 메뉴 및 툴바 UI
  - 이미지 업로드 및 관리 기능

- **장점**:
  - 사용자 친화적인 편집 경험
  - 확장 가능한 기능
  - 커스터마이징 용이성

## 인증 및 권한 패턴

### AWS Cognito 기반 인증
AWS Cognito를 활용한 사용자 인증 및 권한 관리를 구현합니다.

- **구현 방식**:
  - AWS Amplify Auth 모듈 사용
  - 클라이언트 측: useAuthSession 훅
  - 서버 측: AuthGetCurrentUserServer 함수

- **장점**:
  - 안전한 사용자 인증
  - 토큰 기반 인증
  - AWS 서비스와의 통합

### 소유자 기반 권한 모델
데이터 모델에 소유자 기반 권한 모델을 적용합니다.

- **구현 방식**:
  - 모델 정의에 authorization 규칙 적용
  - allow.owner().to(['read', 'create', 'update']) 패턴 사용

- **장점**:
  - 세분화된 접근 제어
  - 사용자 데이터 격리
  - 보안 강화

## 개발 패턴

### 기능 중심 폴더 구조
기능과 관심사에 따라 코드를 구성하는 폴더 구조를 채택합니다.

- **주요 폴더**:
  - src/app: 페이지 컴포넌트
  - src/components: 재사용 가능한 컴포넌트
  - src/hooks: 커스텀 훅
  - src/lib: 유틸리티 함수
  - src/utils: 헬퍼 함수
  - amplify: 백엔드 리소스

- **장점**:
  - 코드 탐색 용이성
  - 관심사 분리
  - 확장성

### AWS Amplify Gen2 IaC 패턴
AWS Amplify Gen2를 활용한 Infrastructure as Code 패턴을 적용합니다.

- **구현 방식**:
  - TypeScript 기반 리소스 정의
  - CDK 구성 요소 활용
  - 선언적 백엔드 정의

- **장점**:
  - 인프라 버전 관리
  - 반복 가능한 배포
  - 개발 환경과 프로덕션 환경의 일관성