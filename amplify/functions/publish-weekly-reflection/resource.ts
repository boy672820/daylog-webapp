import { defineFunction } from '@aws-amplify/backend';

export const publishWeeklyReflection = defineFunction({
  name: 'publish-weekly-reflection',
  schedule: '*/10 * * * ? *',
  resourceGroupName: 'data',
});
