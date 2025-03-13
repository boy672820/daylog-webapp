import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { dailyConsumer } from '../functions/daily-consumer/resource';

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
      ]),

    SummaryType: a.enum(['W']),
    DailySummarized: a.customType({
      type: a.ref('SummaryType').required(),
      year: a.integer().required(),
      value: a.integer().required(),
    }),
    summarizeDailes: a
      .mutation()
      .arguments({
        type: a.string().required(),
        year: a.integer().required(),
        value: a.integer().required(),
      })
      .returns(a.ref('DailySummarized'))
      .handler(
        a.handler.custom({
          dataSource: 'DaylogEventBridgeDataSource',
          entry: './publishSummarizeDailies.js',
        })
      )
      .authorization((allow) => [allow.publicApiKey()]),
  })
  .authorization((allow) => [
    allow.resource(dailyConsumer),
    allow.publicApiKey(),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
});
