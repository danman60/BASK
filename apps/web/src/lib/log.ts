/**
 * Logger (bootstrap skill Step 15c).
 *
 * Always console.logs, and fire-and-forgets to the remote sink when the deploy is
 * configured for it. Never awaited and never throws: logging must not be able to
 * fail a check-in or a campaign send.
 */
export function rlog(tag: string, msg: string, data?: unknown): void {
   
  console.log(`[${tag}] ${msg}` + (data !== undefined ? ` ${JSON.stringify(data)}` : ''));

  const url = process.env.NEXT_PUBLIC_APP_URL;
  const token = process.env.LOG_TOKEN;
  if (!url || !token) return;

  void fetch(`${url}/api/_logs?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ level: 'info', tag, msg, data }),
  }).catch(() => {});
}

export function rerror(tag: string, msg: string, data?: unknown): void {
   
  console.error(`[${tag}] ${msg}` + (data !== undefined ? ` ${JSON.stringify(data)}` : ''));

  const url = process.env.NEXT_PUBLIC_APP_URL;
  const token = process.env.LOG_TOKEN;
  if (!url || !token) return;

  void fetch(`${url}/api/_logs?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ level: 'error', tag, msg, data }),
  }).catch(() => {});
}
