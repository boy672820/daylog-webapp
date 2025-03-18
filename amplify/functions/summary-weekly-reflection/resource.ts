import { defineFunction, secret } from '@aws-amplify/backend';

export const summaryWeeklyReflection = defineFunction({
  name: 'summary-weekly-reflection',
  resourceGroupName: 'data',
  environment: {
    OPENAI_API_KEY: secret(
      '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'
    ),
  },
  timeoutSeconds: 30,
});
