import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { dailyConsumer } from '../functions/daily-consumer/resource';
import {
  summaryWeeklyReflectionCheck,
  summaryWeeklyReflectionFetch,
  summaryWeeklyReflectionSave,
} from '../functions/summary-weekly-reflection/resource';
import { publishWeeklyReflection } from '../functions/publish-weekly-reflection/resource';

const schema = a
  .schema({
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
      .authorization((allow) => [
        allow.owner().to(['read', 'create', 'update']),
      ]),

    Summary: a
      .model({
        userId: a.id().required(),
        summaryId: a.string().required(),
        review: a.string(),
        startDate: a.date().required(),
        endDate: a.date().required(),
        createdDate: a.datetime(),
        updatedDate: a.datetime(),
        contents: a.hasMany('SummaryContent', ['summaryId', 'userId']),
      })
      .identifier(['summaryId', 'userId'])
      .authorization((allow) => [
        allow.owner().to(['read', 'create', 'update']),
        allow.publicApiKey(),
      ]),

    SummaryContent: a
      .model({
        userId: a.id().required(),
        summaryId: a.string().required(),
        date: a.date().required(),
        content: a.string(),
        createdDate: a.datetime(),
        updatedDate: a.datetime(),
        summary: a.belongsTo('Summary', ['summaryId', 'userId']),
      })
      .identifier(['summaryId', 'userId', 'date'])
      .secondaryIndexes((index) => [index('userId').sortKeys(['date'])])
      .authorization((allow) => [
        allow.owner().to(['read', 'create', 'update']),
        allow.publicApiKey(),
      ]),
  })
  .authorization((allow) => [
    allow.resource(dailyConsumer),
    allow.resource(publishWeeklyReflection),
    allow.resource(summaryWeeklyReflectionCheck),
    allow.resource(summaryWeeklyReflectionFetch),
    allow.resource(summaryWeeklyReflectionSave),
    allow.publicApiKey(),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
  },
});
