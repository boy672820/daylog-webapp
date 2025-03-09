import { format, isValid, parseISO } from 'date-fns';
import { Editor } from '../../components/editor';
import { Footer } from '../../components/footer';
import {
  AuthGetCurrentUserServer,
  cookiesClient,
} from '../../utils/amplify-utils';

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

  const content = data?.content || undefined;

  return (
    <>
      <Editor date={date} content={content} />
      <br />
      <br />
      <Footer />
    </>
  );
}

const isNotValid = (date: unknown) => !isValid(date);
