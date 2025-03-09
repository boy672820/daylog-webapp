import { defineFunction } from '@aws-amplify/backend';

export const dynamoDBStreamDaily = defineFunction({
  name: 'dynamodb-stream-daily',
  resourceGroupName: 'data',
});
