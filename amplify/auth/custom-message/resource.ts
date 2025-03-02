import { defineFunction } from '@aws-amplify/backend';

// 커스텀 메시지 함수 정의
export const customMessage = defineFunction({
  name: 'custom-message',
  resourceGroupName: 'auth',
});
