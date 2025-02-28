import { isValid, parseISO } from 'date-fns';
import { Editor } from '../../components/editor';
import { Footer } from '../../components/footer';
import {
  AuthGetCurrentUserServer,
  cookiesClient,
} from '../../utils/amplify-utils';

export default async function Page({
  searchParams,
}: {
  searchParams: { date: string };
}) {
  const { date: dateString } = searchParams;
  const date = parseISO(dateString);

  if (isNotValid(date)) {
    return <div style={{ color: 'red' }}>Error: Invalid date format</div>;
  }

  const user = await AuthGetCurrentUserServer();

  const { data: dailies } = await cookiesClient.models.Daily.list();
  console.log(dailies);

  return (
    <>
      <Editor date={date} />
      <br />
      <br />
      <Footer />
    </>
  );
}

const isNotValid = (date: unknown) => !isValid(date);
