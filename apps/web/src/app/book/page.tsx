import { loadBookingPage } from './actions';
import { BookFlow } from './BookFlow';
import './book.css';

/**
 * Public booking — deliberately OUTSIDE the (bask) route group.
 *
 * This is the only surface a customer ever sees, so it carries none of the
 * operator chrome: no nav, no role switcher, no presenter affordances. Same
 * tokens, different audience.
 */
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Book a session',
};

export default async function BookPage() {
  const { salon, services } = await loadBookingPage();
  return (
    <main className="book-page">
      <BookFlow salon={salon} services={services} />
      <footer className="book-footer">
        {salon.name} &middot; {salon.city}, {salon.region}
      </footer>
    </main>
  );
}
