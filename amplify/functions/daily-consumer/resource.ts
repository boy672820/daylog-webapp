import { defineFunction } from '@aws-amplify/backend';

export const dailyConsumer = defineFunction({
  name: 'daily-consumer',
  resourceGroupName: 'data',
});
