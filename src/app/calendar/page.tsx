import { Footer } from '../../components/footer';
import { Calendar } from '../../components/calendar';
import { Header } from '../../components/header';
import { parseISO } from 'date-fns';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  // URL 파라미터에서 년월 정보 가져오기
  const { date: dateParam } = await searchParams;
  const date = dateParam ? parseISO(dateParam) : new Date();

  return (
    <>
      <Header />
      <main className='container mx-auto max-w-4xl py-6'>
        <Calendar initialMonth={date} />
      </main>
      <Footer />
    </>
  );
}
