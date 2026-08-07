import { TODAY_UI } from '@bask/ui';

/**
 * Loading state, designed rather than defaulted (IMPLEMENTATION_SPEC §7).
 *
 * It is the shape of the real page — headline block, three cards, a rail — so the
 * layout does not jump when the data lands. The line of copy is there because a
 * silent skeleton makes a slow morning look broken.
 */
export default function TodayLoading() {
  return (
    <main className="b-shell" aria-busy="true">
      <section>
        <div className="b-skel b-skel-head" />
        <div className="b-skel b-skel-line" style={{ maxWidth: '46ch' }} />
        <div className="b-skel b-skel-line" style={{ maxWidth: '38ch' }} />
        <p className="b-skel-note" style={{ marginTop: 'var(--space-6)' }}>
          {TODAY_UI.loading}
        </p>
        <div className="b-skel b-skel-card" />
        <div className="b-skel b-skel-card" />
        <div className="b-skel b-skel-card" />
      </section>
      <aside>
        <div className="b-skel b-skel-card" style={{ height: 180 }} />
        <div className="b-skel b-skel-card" style={{ height: 160 }} />
      </aside>
    </main>
  );
}
