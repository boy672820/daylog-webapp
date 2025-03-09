import { EventBridgeHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { format, getISOWeek, getISOWeekYear } from 'date-fns';
import Turndown from 'turndown';
import { Logger } from '@aws-lambda-powertools/logger';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/daily-consumer';
import type { Schema } from '../../data/resource';

interface Payload {
  userId: string;
  date: string;
  content: string;
}

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  env
);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'dynamodb-stream-daily-handler',
});

const turndown = new Turndown({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
});

export const handler: EventBridgeHandler<
  'Scheduled Event',
  unknown,
  void
> = async (event) => {
  logger.info('Event received', {
    id: event.id,
    detailType: event['detail-type'],
    source: event.source,
  });

  const payload = event.detail;

  if (!isValidPayload(payload)) {
    logger.error('Invalid payload', { payload });
    return;
  }

  const { userId, date: awsDate, content } = payload;

  const date = new Date(awsDate);
  const isoYear = String(getISOWeekYear(date));
  const isoWeek = String(getISOWeek(date)).padStart(2, '0');
  const summaryId = `W#${isoYear}#${isoWeek}`;

  const { data: summary } = await client.models.Summary.get({
    userId,
    summaryId,
  });

  if (!summary) {
    const startDate = new Date(date);
    const day = startDate.getDay();
    startDate.setDate(startDate.getDate() - (day === 0 ? 6 : day - 1));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const awsStartDate = format(startDate, 'yyyy-MM-dd');
    const awsEndDate = format(endDate, 'yyyy-MM-dd');

    const { errors } = await client.models.Summary.create({
      userId,
      summaryId,
      review: '',
      startDate: awsStartDate,
      endDate: awsEndDate,
    });

    if (errors) {
      logger.error('Failed to create a summary', {
        userId,
        summaryId,
        startDate: awsStartDate,
        endDate: awsEndDate,
        errors,
      });
      return;
    }
  }

  const { data: summaryContent } = await client.models.SummaryContent.get({
    userId,
    summaryId,
    date: awsDate,
  });

  if (summaryContent) {
    const { errors } = await client.models.SummaryContent.update({
      summaryId,
      userId,
      date: awsDate,
      content: turndown.turndown(content),
    });

    if (errors) {
      logger.error('Failed to update a summary content', {
        userId,
        summaryId,
        date,
        errors,
      });
      return;
    }
  } else {
    const { errors } = await client.models.SummaryContent.create({
      userId,
      summaryId,
      date: awsDate,
      content: turndown.turndown(content),
    });

    if (errors) {
      logger.error('Failed to create a summary content', {
        userId,
        summaryId,
        date,
        errors,
      });
      return;
    }
  }

  logger.info('Event processed', { id: event.id });
};

const isValidPayload = (payload: unknown): payload is Payload => {
  if (!payload || typeof payload !== 'object') return false;

  return (
    'userId' in payload &&
    typeof payload.userId === 'string' &&
    'date' in payload &&
    typeof payload.date === 'string' &&
    'content' in payload &&
    typeof payload.content === 'string'
  );
};
