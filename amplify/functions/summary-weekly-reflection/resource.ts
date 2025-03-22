import { defineFunction, secret } from '@aws-amplify/backend';

export const summaryWeeklyReflectionCheck = defineFunction({
  name: 'summary-weekly-reflection-check',
  entry: 'check/index.ts',
  resourceGroupName: 'data',
  timeoutSeconds: 10,
});

export const summaryWeeklyReflectionFetch = defineFunction({
  name: 'summary-weekly-reflection-fetch',
  entry: 'fetch/index.ts',
  resourceGroupName: 'data',
  timeoutSeconds: 15,
});

export const summaryWeeklyReflectionGenerateWithAi = defineFunction({
  name: 'summary-weekly-reflection-generate-with-ai',
  entry: 'generate-with-ai/index.ts',
  resourceGroupName: 'data',
  environment: {
    OPENAI_API_KEY: secret('openai-api-key'),
  },
  timeoutSeconds: 60,
});

export const summaryWeeklyReflectionSave = defineFunction({
  name: 'summary-weekly-reflection-save',
  entry: 'save/index.ts',
  resourceGroupName: 'data',
  timeoutSeconds: 10,
});
