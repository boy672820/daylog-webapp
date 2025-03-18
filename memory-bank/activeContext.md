# 현재 작업 컨텍스트

## 현재 작업 중인 기능/태스크
- 주간 회고 AI 요약 기능 구현

## 최근 변경사항
- memory-bank 디렉토리 생성
- 핵심 메모리 뱅크 파일 생성 (projectBrief.md, activeContext.md, productContext.md, progress.md, decisionLog.md, systemPatterns.md)
- 프로젝트 코드 분석 완료
- DailySummarizedRule을 처리하는 Lambda 함수(daily-summarized) 추가
- summary-weekly-reflection Lambda 함수 구현 (주간 회고 AI 요약)

## 현재 이슈/문제점
- 없음

## 다음 단계
- 코드 분석 결과를 바탕으로 시스템 패턴 문서 업데이트
- 개발 우선순위 설정
- 기능 구현 계획 수립

## 참고 자료
- README.md
- docs/database-schema.md
- docs/system-design.md
- src/app/page.tsx (랜딩 페이지)
- src/app/daily/page.tsx (일일 회고 페이지)
- src/components/editor.tsx (회고 에디터 컴포넌트)
- src/components/tiptap/rich-text-editor.tsx (리치 텍스트 에디터)
- src/app/calendar/page.tsx (캘린더 페이지)
- src/components/calendar.tsx (캘린더 컴포넌트)
- src/hooks/use-auth-session.ts (인증 세션 훅)
- src/utils/amplify-utils.ts (Amplify 유틸리티)
- amplify/backend.ts (백엔드 설정)
- amplify/data/resource.ts (데이터 모델)
- amplify/functions/dynamodb-stream-daily/handler.ts (DynamoDB 스트림 핸들러)
- amplify/functions/daily-consumer/handler.ts (이벤트 소비자 핸들러)
- amplify/data/publishSummarizeDailies.js (요약 이벤트 발행)