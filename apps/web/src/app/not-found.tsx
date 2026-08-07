import Link from 'next/link';

/** Styled 404 (bootstrap skill Step 12). */
export default function NotFound() {
  return (
    <main className="state-page">
      <p className="state-eyebrow">Not found</p>
      <h1>There&rsquo;s nothing at this address.</h1>
      <p className="state-body">
        The link may be out of date, or the page may have moved. Today&rsquo;s summary is the
        best place to pick things back up.
      </p>
      <Link href="/" className="state-action">
        Go to Today
      </Link>
    </main>
  );
}
