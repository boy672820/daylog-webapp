import { Footer } from '../../components/footer';
import { Calendar } from '../../components/calendar';
import { Header } from '../../components/header';

export default async function Page() {
  return (
    <>
      <Header />
      <div className='mx-auto flex max-w-4xl h-full items-center'>
        <Calendar />
      </div>
      <br />
      <Footer />
    </>
  );
}
