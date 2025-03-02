import { format, isValid, parseISO } from 'date-fns';
import { Editor } from '../../components/editor';
import { Footer } from '../../components/footer';
import {
  AuthGetCurrentUserServer,
  cookiesClient,
} from '../../utils/amplify-utils';
import { content as initialContent } from '../../lib/content';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ date: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date = parseISO(dateParam);
  const dateString = format(date, 'yyyy-MM-dd');

  if (isNotValid(date)) {
    return <div style={{ color: 'red' }}>Error: Invalid date format</div>;
  }

  const { userId } = await AuthGetCurrentUserServer();

  const { data } = await cookiesClient.models.Daily.get({
    userId,
    date: dateString,
  });

  if (!data) {
    await cookiesClient.models.Daily.create({
      userId,
      date: dateString,
    });
  }

  return (
    <>
      <Editor
        dateString={dateString}
        content={data?.content || initialContent}
      />
      <br />
      <br />
      <Footer />
    </>
  );
}

const isNotValid = (date: unknown) => !isValid(date);
