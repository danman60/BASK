'use client';

/**
 * Studio — the campaign builder (DESIGN_SPEC §3.3, mockup 03).
 *
 * Flow: goal → audience → offer → generate → review → schedule.
 *
 * Two things this component is careful about:
 *
 *  - **Nothing sends.** The only mutation that changes lifecycle state is
 *    `schedule`, it is behind a button that says what it does, and the whisper
 *    beside it names the exact number of people and says nothing goes out until
 *    it is pressed. The consent line quotes the SMS-consent count, not the
 *    segment size.
 *  - **Provenance stays visible.** The context banner ("Fixing: …") stays on
 *    screen for the whole flow, and the footer says which path wrote the words.
 */

import { WHISPERS, WhisperNote } from '@bask/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { trpc } from '@/lib/trpc';

import { STUDIO_COPY as C } from './copy';
import { BoldFacts, EditableText, ProvenanceNote, formatDayTime } from './pieces';
import type { CampaignContent, FixingContext } from './types';

type Step = 'goal' | 'audience' | 'offer' | 'review' | 'schedule';

const STEP_ORDER: Step[] = ['goal', 'audience', 'offer', 'review', 'schedule'];
const STEP_LABELS = C.steps;

const TONES = [
  { key: 'warm', label: 'Warm' },
  { key: 'fun', label: 'Fun' },
  { key: 'straight', label: 'Straight-talk' },
] as const;

const CHANNEL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  sms: 'Text message',
  email: 'Email',
};

type Content = CampaignContent | null;

export function StudioBuilder({
  insightId,
  campaignId: initialCampaignId,
}: {
  insightId: string | null;
  campaignId: string | null;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const context = trpc.marketing.studioContext.useQuery(
    { insightId: insightId ?? undefined },
    { enabled: !initialCampaignId },
  );
  const existing = trpc.marketing.campaign.useQuery(
    { campaignId: initialCampaignId ?? '' },
    { enabled: Boolean(initialCampaignId) },
  );
  const segments = trpc.marketing.segments.useQuery();

  const [campaignId, setCampaignId] = useState<string | null>(initialCampaignId);
  // Entering from an insight means goal and audience arrived pre-filled, so the
  // owner lands one click away from generating. From scratch, start at the top.
  const [step, setStep] = useState<Step>(initialCampaignId ? 'review' : insightId ? 'offer' : 'goal');
  const [goal, setGoal] = useState('');
  const [audienceKey, setAudienceKey] = useState<string>('lapsed_30d');
  const [channels, setChannels] = useState<string[]>(['sms', 'instagram', 'email']);
  const [offer, setOffer] = useState({
    headline: '20% off',
    discountPercent: 20 as number | null,
    discountAmount: null as number | null,
    validity: 'this week',
  });
  const [tone, setTone] = useState<'warm' | 'fun' | 'straight'>('warm');
  const [content, setContent] = useState<Content>(null);
  const [generation, setGeneration] = useState<{
    source: 'ai' | 'fallback';
    model: string | null;
  } | null>(null);
  const [variant, setVariant] = useState(0);
  const [showWhy, setShowWhy] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<{ recipients: number; sendAt: string } | null>(null);

  // Seed the form from whichever entry point supplied it.
  useEffect(() => {
    if (!context.data) return;
    setGoal(context.data.goal);
    setAudienceKey(context.data.audience.key);
    setChannels(context.data.channels);
    setOffer(context.data.offer);
  }, [context.data]);

  useEffect(() => {
    if (!existing.data?.content) return;
    setContent(existing.data.content);
    setGoal(existing.data.content.goal);
    setTone(existing.data.content.tone);
    setOffer(existing.data.content.offer);
    setChannels(existing.data.channels);
    setGeneration({
      source: existing.data.content.provenance.source,
      model: existing.data.content.provenance.model,
    });
  }, [existing.data]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const guardVerdict = trpc.marketing.checkOffer.useQuery({ offer }, { enabled: step === 'offer' });

  const generate = trpc.marketing.generate.useMutation({
    onSuccess: (result) => {
      setCampaignId(result.campaignId);
      setContent(result.content);
      setGeneration({ source: result.generation.source, model: result.generation.model });
      setStep('review');
      void utils.marketing.campaigns.invalidate();
    },
  });

  const regenerate = trpc.marketing.regeneratePiece.useMutation({
    onSuccess: (result) => {
      setContent(result.content);
      setGeneration({ source: result.generation.source, model: result.generation.model });
    },
  });

  const changeTone = trpc.marketing.changeTone.useMutation({
    onSuccess: (result) => {
      setContent(result.content);
      setGeneration({ source: result.generation.source, model: result.generation.model });
    },
  });

  const saveContent = trpc.marketing.updateContent.useMutation({
    onSuccess: (result) => setContent(result.content),
  });

  const schedule = trpc.marketing.schedule.useMutation({
    onSuccess: (result) => {
      setScheduled({
        recipients: result.recipients,
        sendAt: result.scheduledFor?.toISOString() ?? '',
      });
      setStep('schedule');
      void utils.marketing.campaigns.invalidate();
      void utils.marketing.calendar.invalidate();
    },
  });

  const audience = useMemo(() => {
    const match = segments.data?.segments.find((s) => s.key === audienceKey);
    if (!match) return null;
    const direct = channels.filter((c) => c === 'sms' || c === 'email');
    // The number quoted to the owner: the segment narrowed to people who agreed
    // to at least one channel this campaign uses.
    const count =
      direct.length === 0
        ? match.total
        : Math.max(...direct.map((c) => match.reachable[c as 'sms' | 'email']));
    return { ...match, count };
  }, [segments.data, audienceKey, channels]);

  const sendAt = context.data?.schedule.sendAt ?? existing.data?.scheduledFor?.toISOString() ?? null;
  const fixing: FixingContext | null = context.data?.fixing ?? existing.data?.fixing ?? null;
  const salon = context.data?.salon ?? existing.data?.salon ?? { name: 'Your salon', handle: 'salon' };

  const commit = useCallback(
    (next: Content) => {
      if (!next || !campaignId) return;
      setContent(next);
      saveContent.mutate({ campaignId, content: next });
    },
    [campaignId, saveContent],
  );

  const busy =
    generate.isPending || regenerate.isPending || changeTone.isPending || schedule.isPending;

  return (
    <>
      <header className="st-topbar">
        <a className="st-wordmark" href="/marketing">
          Bask
        </a>
        <span className="st-crumb">
          <a href="/marketing">Marketing</a> · <b>New campaign</b>
        </span>
        <div className="st-steps">
          {STEP_ORDER.map((s, index) => {
            const currentIndex = STEP_ORDER.indexOf(step);
            const state = index < currentIndex ? 'is-done' : index === currentIndex ? 'is-current' : '';
            return (
              <span key={s} style={{ display: 'contents' }}>
                <button
                  type="button"
                  className={`st-step ${state}`}
                  onClick={() => {
                    if (index < currentIndex && step !== 'schedule') setStep(s);
                  }}
                  disabled={index >= currentIndex || step === 'schedule'}
                >
                  {index < currentIndex ? '✓ ' : ''}
                  {STEP_LABELS[s]}
                </button>
                {index < STEP_ORDER.length - 1 && <span className="st-sep">·</span>}
              </span>
            );
          })}
        </div>
      </header>

      <main className="st-shell">
        {/* Provenance stays put for the whole flow — the owner never loses sight
            of which finding this campaign is answering. */}
        {fixing && (
          <div className="st-context">
            <div className="st-context-bar" />
            <p>
              <b>{C.context.fixing(fixing.title)}</b>{' '}
              <BoldFacts text={fixing.evidenceSentence} />
            </p>
            {fixing.whyThisOffer && (
              <button
                type="button"
                className="btn btn-quiet st-why"
                onClick={() => setShowWhy((v) => !v)}
              >
                {showWhy ? C.context.hideWhy : C.context.why}
              </button>
            )}
          </div>
        )}
        {showWhy && fixing?.whyThisOffer && (
          <div className="st-why-panel">
            <h4>{C.context.whyHeading}</h4>
            <ul>
              {fixing.whyThisOffer.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {step === 'goal' && (
          <SetupCard
            title={C.goal.title}
            sub={C.goal.sub}
            onNext={() => setStep('audience')}
            nextLabel={C.goal.next}
            canNext={goal.trim().length > 2}
          >
            <div className="st-field">
              <label htmlFor="goal">{C.goal.label}</label>
              <input
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={C.goal.placeholder}
              />
              <p className="st-hint">{C.goal.hint}</p>
            </div>
          </SetupCard>
        )}

        {step === 'audience' && (
          <SetupCard
            title={C.audience.title}
            sub={C.audience.sub}
            onNext={() => setStep('offer')}
            nextLabel={C.audience.next}
            canNext={Boolean(audience && audience.count > 0)}
            onBack={() => setStep('goal')}
            aside={
              audience ? (
                <div className="card">
                  <h4>{C.audience.reaching}</h4>
                  <div className="st-aud-n num">{C.review.people(audience.count)}</div>
                  <p className="st-aud-sub">{audience.description}</p>
                  <div className="st-chips">
                    {audience.criteria.map((c) => (
                      <span className="st-chip" key={c}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null
            }
          >
            <div className="st-field">
              <label>{C.audience.segmentsLabel}</label>
              <div className="st-seg-list">
                {segments.data?.segments.map((s) => (
                  <button
                    type="button"
                    key={s.key}
                    className={`st-seg ${s.key === audienceKey ? 'is-selected' : ''}`}
                    onClick={() => setAudienceKey(s.key)}
                  >
                    <span className="st-seg-n num">{s.total}</span>
                    <span>
                      <span className="st-seg-label">{s.label}</span>
                      <span className="st-seg-desc">{s.description}</span>
                    </span>
                    <span className="st-seg-reach num">
                      {C.audience.textsOk(s.reachable.sms)}
                      <br />
                      {C.audience.emailsOk(s.reachable.email)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="st-field">
              <label>{C.audience.channelsLabel}</label>
              <div className="st-channels">
                {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
                  <button
                    type="button"
                    key={key}
                    className={`st-channel ${channels.includes(key) ? 'is-selected' : ''}`}
                    onClick={() =>
                      setChannels((prev) =>
                        prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
                      )
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="st-hint">{C.audience.channelHint}</p>
            </div>
          </SetupCard>
        )}

        {step === 'offer' && (
          <SetupCard
            title={C.offer.title}
            sub={C.offer.sub}
            onNext={() => {
              generate.mutate({
                campaignId,
                insightId,
                goal,
                audienceKey,
                channels: channels as never,
                offer,
                tone,
                sendAt: sendAt ?? undefined,
                variant,
              });
            }}
            nextLabel={generate.isPending ? C.offer.generating : C.offer.generate}
            canNext={!busy && Boolean(guardVerdict.data?.ok ?? true)}
            onBack={() => setStep('audience')}
            aside={
              audience ? (
                <div className="card">
                  <h4>{C.review.audience}</h4>
                  <div className="st-aud-n num">{C.review.people(audience.count)}</div>
                  <p className="st-aud-sub">{audience.description}</p>
                  <div className="st-row">
                    <span>{C.review.send}</span>
                    <span className="st-v">{formatDayTime(sendAt)}</span>
                  </div>
                  <div className="st-row">
                    <span>{C.review.offerValid}</span>
                    <span className="st-v">{offer.validity}</span>
                  </div>
                </div>
              ) : null
            }
          >
            <div className="st-field">
              <label htmlFor="offer-headline">{C.offer.offerLabel}</label>
              <input
                id="offer-headline"
                value={offer.headline}
                onChange={(e) => {
                  const headline = e.target.value;
                  const percent = /(\d{1,3})\s?%/.exec(headline);
                  const amount = /\$\s?(\d{1,4}(?:\.\d{2})?)/.exec(headline);
                  setOffer((prev) => ({
                    ...prev,
                    headline,
                    // Read the number back out of what they typed, so the cap
                    // applies to "40% off" typed by hand, not only to ours.
                    discountPercent: percent ? Number(percent[1]) : null,
                    discountAmount: amount ? Number(amount[1]) : null,
                  }));
                }}
              />
            </div>
            <div className="st-field">
              <label htmlFor="offer-validity">{C.offer.validityLabel}</label>
              <input
                id="offer-validity"
                value={offer.validity}
                onChange={(e) => setOffer((prev) => ({ ...prev, validity: e.target.value }))}
              />
            </div>
            {guardVerdict.data && !guardVerdict.data.ok && (
              <div className="st-guard">
                <span>{guardVerdict.data.message}</span>
                {guardVerdict.data.suggestion && (
                  <button
                    type="button"
                    onClick={() => setOffer(guardVerdict.data!.suggestion!)}
                  >
                    {C.offer.useSuggestion(guardVerdict.data.suggestion.headline)}
                  </button>
                )}
              </div>
            )}
            {guardVerdict.data?.ok && guardVerdict.data.message && (
              <div className="st-guard">
                <span>{guardVerdict.data.message}</span>
              </div>
            )}
          </SetupCard>
        )}

        {step === 'review' && content && (
          <>
            <div className="st-head">
              <h1>{C.review.title}</h1>
              <span className="st-sub">{C.review.sub}</span>
              <div className="st-tones">
                {TONES.map((t) => (
                  <button
                    type="button"
                    key={t.key}
                    className={`st-tone ${tone === t.key ? 'is-selected' : ''}`}
                    disabled={busy}
                    onClick={() => {
                      setTone(t.key);
                      if (campaignId) changeTone.mutate({ campaignId, tone: t.key });
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {showPhone ? (
              <PhonePreview
                content={content}
                salon={salon}
                onBack={() => setShowPhone(false)}
                onSchedule={() => campaignId && schedule.mutate({ campaignId })}
                scheduling={schedule.isPending}
                smsConsentCount={audience?.reachable.sms ?? 0}
              />
            ) : (
              <div className="st-grid">
                <article className="st-out card">
                  <div className="st-out-head">
                    <span className="st-ch">{C.review.channels.instagram}</span>
                    <button
                      type="button"
                      className="st-regen"
                      disabled={busy || !campaignId}
                      onClick={() => {
                        if (!campaignId) return;
                        setVariant((v) => v + 1);
                        regenerate.mutate({ campaignId, piece: 'instagram', variant: variant + 1 });
                      }}
                    >
                      {C.review.regenerate}
                    </button>
                  </div>
                  <div className="st-canvas">
                    <EditableText
                      as="h2"
                      ariaLabel="Graphic headline"
                      value={content.graphic.headline}
                      onCommit={(next) =>
                        commit({ ...content, graphic: { ...content.graphic, headline: next } })
                      }
                    />
                    <span className="st-badge num">{content.graphic.badge}</span>
                  </div>
                  <EditableText
                    className="st-caption"
                    ariaLabel="Instagram caption"
                    value={content.instagram.caption}
                    onCommit={(next) =>
                      commit({ ...content, instagram: { ...content.instagram, caption: next } })
                    }
                  >
                    <>
                      <b>{content.instagram.handle}</b> — {content.instagram.caption}
                    </>
                  </EditableText>
                </article>

                {/* One grid column holding both text-based cards, so the email
                    card sits directly under the text message instead of being
                    pushed to a second grid row by the taller Instagram card. */}
                <div className="st-col">
                  <article className="st-out card">
                  <div className="st-out-head">
                    <span className="st-ch">{C.review.channels.sms}</span>
                    <button
                      type="button"
                      className="st-regen"
                      disabled={busy || !campaignId}
                      onClick={() => {
                        if (!campaignId) return;
                        setVariant((v) => v + 1);
                        regenerate.mutate({ campaignId, piece: 'sms', variant: variant + 1 });
                      }}
                    >
                      {C.review.regenerate}
                    </button>
                  </div>
                  <div className="st-sms-body">
                    <EditableText
                      className="st-bubble"
                      ariaLabel="Text message"
                      value={content.sms.body}
                      onCommit={(next) => commit({ ...content, sms: { body: next } })}
                    />
                    <div className="st-bubble-meta num">
                      <span className={content.sms.body.length > 160 ? 'is-over' : undefined}>
                        {C.review.characters(content.sms.body.length)}
                      </span>
                      <span>·</span>
                      <span>{C.review.credits(Math.ceil(content.sms.body.length / 160))}</span>
                    </div>
                  </div>
                  {/* The trust copy. It is design, not decoration — DESIGN_SPEC
                      §3.3 puts the consequence at the point of action. */}
                  <p className="st-edit-note">
                    {WHISPERS.campaignAudience(audience?.reachable.sms ?? 0)}{' '}
                    {C.review.nothingSendsUntilSchedule}
                  </p>
                  <div className="st-line">
                    <span className="st-k">{C.review.emailSubject}</span>
                    <EditableText
                      as="span"
                      multiline={false}
                      ariaLabel="Email subject"
                      value={content.email.subject}
                      onCommit={(next) =>
                        commit({ ...content, email: { ...content.email, subject: next } })
                      }
                    />
                  </div>
                </article>

                {/* The long-form channels sit in their own card under the text
                    message rather than inside it. Mockup 03's middle column is
                    short, and stacking the email body into it made that column
                    run 300px past the Instagram card. */}
                  <article className="st-out card" style={{ marginTop: 'var(--space-6)' }}>
                  <div className="st-out-head">
                    <span className="st-ch">{C.review.emailBody}</span>
                    <button
                      type="button"
                      className="st-regen"
                      disabled={busy || !campaignId}
                      onClick={() => {
                        if (!campaignId) return;
                        setVariant((v) => v + 1);
                        regenerate.mutate({ campaignId, piece: 'email', variant: variant + 1 });
                      }}
                    >
                      {C.review.regenerate}
                    </button>
                  </div>
                  <div className="st-line" style={{ borderTop: 0 }}>
                    <EditableText
                      as="div"
                      ariaLabel="Email body"
                      value={content.email.body}
                      onCommit={(next) =>
                        commit({ ...content, email: { ...content.email, body: next } })
                      }
                    >
                      <pre>{content.email.body}</pre>
                    </EditableText>
                  </div>
                  <div className="st-line">
                    <span className="st-k">{C.review.facebook}</span>
                    <EditableText
                      as="div"
                      ariaLabel="Facebook post"
                      value={content.facebook.body}
                      onCommit={(next) => commit({ ...content, facebook: { body: next } })}
                    />
                  </div>
                  </article>
                </div>

                <aside className="st-side">
                  <div className="card">
                    <h4>{C.review.audience}</h4>
                    <div className="st-aud-n num">{C.review.people(audience?.count ?? 0)}</div>
                    <p className="st-aud-sub">{audience?.description}</p>
                    <div className="st-chips">
                      {/* Consent is a criterion, not a footnote — it is what
                          narrowed the segment to this number. */}
                      {channels.includes('sms') && <span className="st-chip">{C.review.textsOk}</span>}
                      {channels.includes('email') && (
                        <span className="st-chip">{C.review.emailsOk}</span>
                      )}
                      {audience?.criteria.map((c) => (
                        <span className="st-chip" key={c}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="card">
                    <h4>{C.review.schedule}</h4>
                    <div className="st-row">
                      <span>{C.review.send}</span>
                      <span className="st-v">{formatDayTime(sendAt)}</span>
                    </div>
                    <div className="st-row">
                      <span>{C.review.offerValid}</span>
                      <span className="st-v">{content.offer.validity}</span>
                    </div>
                    <div className="st-row">
                      <span>{C.review.resultsTracked}</span>
                      <span className="st-v">{C.review.resultsAutomatic}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-quiet st-cta"
                    onClick={() => setShowPhone(true)}
                  >
                    {C.review.preview}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary st-cta"
                    disabled={busy || !campaignId}
                    onClick={() => campaignId && schedule.mutate({ campaignId })}
                  >
                    {schedule.isPending ? C.review.scheduling : C.review.scheduleCampaign}
                  </button>
                  <p className="st-note">{C.review.afterSchedule}</p>
                  {generation && (
                    <p className="st-note">
                      <ProvenanceNote source={generation.source} model={generation.model} />
                    </p>
                  )}
                </aside>
              </div>
            )}
          </>
        )}

        {step === 'schedule' && scheduled && (
          <div className="card" style={{ padding: 'var(--space-10)', textAlign: 'center' }}>
            <h1
              style={{
                font: '500 var(--text-2xl)/1.2 var(--font-display)',
                marginBottom: 'var(--space-3)',
              }}
            >
              {C.scheduled.title(formatDayTime(scheduled.sendAt))}
            </h1>
            <p className="st-note">{C.scheduled.body(scheduled.recipients)}</p>
            <WhisperNote note="nothingSendsYet" />
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-3)',
                justifyContent: 'center',
                marginTop: 'var(--space-6)',
              }}
            >
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => router.push('/marketing?tab=campaigns')}
              >
                {C.scheduled.seeCampaigns}
              </button>
              <button type="button" className="btn btn-quiet" onClick={() => router.push('/')}>
                {C.scheduled.backToToday}
              </button>
            </div>
          </div>
        )}

        {generate.error && (
          <p className="st-guard" style={{ marginTop: 'var(--space-5)' }}>
            {generate.error.message}
          </p>
        )}
        {(context.isPending && !initialCampaignId) || (existing.isPending && initialCampaignId) ? (
          <p className="st-busy">{C.loadingContext}</p>
        ) : null}
      </main>

      {toast && <div className="st-toast">{toast}</div>}
    </>
  );
}

function SetupCard({
  title,
  sub,
  children,
  aside,
  onNext,
  nextLabel,
  canNext,
  onBack,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
  onNext: () => void;
  nextLabel: string;
  canNext: boolean;
  onBack?: () => void;
}) {
  return (
    <>
      <div className="st-head">
        <h1>{title}</h1>
        <span className="st-sub">{sub}</span>
      </div>
      <div className="st-setup">
        <div className="card">
          {children}
          <div className="st-actions">
            <button type="button" className="btn btn-primary" onClick={onNext} disabled={!canNext}>
              {nextLabel}
            </button>
            {onBack && (
              <button type="button" className="btn btn-ghost" onClick={onBack}>
                {C.back}
              </button>
            )}
          </div>
        </div>
        <aside className="st-side">{aside}</aside>
      </div>
    </>
  );
}

/**
 * Phone-frame preview. Deliberately pretty: this is the screen that convinces a
 * salon owner the post is worth sending, and a wireframe would not.
 */
function PhonePreview({
  content,
  salon,
  onBack,
  onSchedule,
  scheduling,
  smsConsentCount,
}: {
  content: NonNullable<Content>;
  salon: { name: string; handle: string };
  onBack: () => void;
  onSchedule: () => void;
  scheduling: boolean;
  smsConsentCount: number;
}) {
  const [surface, setSurface] = useState<'instagram' | 'sms' | 'email'>('instagram');

  return (
    <div className="st-phone-wrap">
      <div className="st-phone">
        <div className="st-phone-screen">
          <div className="st-phone-bar">
            <span className="st-phone-avatar" />
            <span>{surface === 'sms' ? salon.name : content.instagram.handle}</span>
          </div>
          <div className="st-phone-body">
            {surface === 'instagram' && (
              <>
                <div className="st-phone-canvas">
                  <h3>{content.graphic.headline}</h3>
                  <span className="num">{content.graphic.badge}</span>
                </div>
                <p className="st-phone-caption">
                  <b>{content.instagram.handle}</b> {content.instagram.caption}
                </p>
              </>
            )}
            {surface === 'sms' && (
              <div className="st-bubble" style={{ fontSize: 'var(--text-xs)' }}>
                {content.sms.body.replace('{{first name}}', 'Maya')}
              </div>
            )}
            {surface === 'email' && (
              <>
                <p style={{ font: '600 var(--text-sm)/1.35 var(--font-body)' }}>
                  {content.email.subject}
                </p>
                <pre className="st-phone-caption" style={{ whiteSpace: 'pre-wrap' }}>
                  {content.email.body.replace('{{first name}}', 'Maya')}
                </pre>
              </>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="st-phone-tabs">
          {(['instagram', 'sms', 'email'] as const).map((s) => (
            <button
              type="button"
              key={s}
              className={`st-phone-tab ${surface === s ? 'is-selected' : ''}`}
              onClick={() => setSurface(s)}
            >
              {C.preview.tabs[s]}
            </button>
          ))}
        </div>
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h4 style={{ font: '600 var(--text-sm)/1 var(--font-body)', color: 'var(--ink-faint)' }}>
            {C.preview.title}
          </h4>
          <p className="st-aud-sub">{C.preview.body}</p>
          <p className="st-edit-note" style={{ margin: 'var(--space-4) 0 0' }}>
            {WHISPERS.campaignAudience(smsConsentCount)} {C.review.nothingSendsUntilSchedule}
          </p>
          <div className="st-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onSchedule}
              disabled={scheduling}
            >
              {scheduling ? C.review.scheduling : C.review.scheduleCampaign}
            </button>
            <button type="button" className="btn btn-quiet" onClick={onBack}>
              {C.preview.back}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

