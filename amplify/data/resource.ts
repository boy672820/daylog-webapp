import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Daily: a
    .model({
      userId: a.id().required(),
      date: a.date().required(),
      content: a.string(),
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
    })
    .identifier(['userId', 'date'])
    .secondaryIndexes((index) => [index('userId').sortKeys(['date'])])
    .authorization((allow) => [allow.owner().to(['read', 'create', 'update'])]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
