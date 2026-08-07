import { NextResponse, type NextRequest } from 'next/server';

import { db } from '@bask/db';

/**
 * Remote log sink (bootstrap skill Step 15c — "NOT optional").
 *
 * Server actions, middleware and the browser all POST here, so a failure during a
 * live demo can be pulled from any machine:
 *
 *   curl "https://<deploy>/api/_logs?token=$LOG_TOKEN&since=0" | jq
 *
 * Gated on LOG_TOKEN because the rows contain operational detail. If the token is
 * unset the endpoint refuses everything rather than defaulting open — an
 * unconfigured deploy should be silent, not public.
 */

export const dynamic = 'force-dynamic';

function authorised(req: NextRequest): boolean {
  const expected = process.env.LOG_TOKEN;
  if (!expected) return false;
  return req.nextUrl.searchParams.get('token') === expected;
}

export async function GET(req: NextRequest) {
  if (!authorised(req)) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }

  const since = Number(req.nextUrl.searchParams.get('since') ?? 0);
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 200), 1000);

  const rows = await db.appLog.findMany({
    where: since > 0 ? { ts: { gt: new Date(since) } } : undefined,
    orderBy: { ts: 'desc' },
    take: limit,
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: Number(r.id),
      ts: r.ts.getTime(),
      level: r.level,
      tag: r.tag,
      msg: r.msg,
      data: r.data,
    })),
  );
}

export async function POST(req: NextRequest) {
  if (!authorised(req)) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    level?: string;
    tag?: string;
    msg?: string;
    data?: unknown;
  } | null;

  if (!body?.tag || !body?.msg) {
    return NextResponse.json({ error: 'tag and msg are required' }, { status: 400 });
  }

  await db.appLog.create({
    data: {
      level: body.level ?? 'info',
      tag: body.tag.slice(0, 64),
      msg: body.msg.slice(0, 2000),
      data: body.data === undefined ? undefined : (body.data as object),
    },
  });

  return NextResponse.json({ ok: true });
}
