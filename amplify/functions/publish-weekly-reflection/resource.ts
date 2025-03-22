import { defineFunction } from '@aws-amplify/backend';

export const publishWeeklyReflection = defineFunction({
  name: 'publish-weekly-reflection',
  schedule: '0 2 ? * 1 *',
  resourceGroupName: 'data',
});
