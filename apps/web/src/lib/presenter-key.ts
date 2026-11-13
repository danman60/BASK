/** Presenter key, kept in this browser only. Sent as a header so the demo clock controls unlock. */
const STORAGE_KEY = 'bask.presenterKey';

export function readPresenterKey(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writePresenterKey(value: string): void {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, value);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private window or blocked storage: the key just won't persist.
  }
}
