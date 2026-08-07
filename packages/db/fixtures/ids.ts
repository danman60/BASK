/**
 * Deterministic UUIDs.
 *
 * Every fixture row needs a stable primary key: the schema defaults to
 * `gen_random_uuid()`, which would hand out different ids on every reset and
 * make a byte-for-byte diff between two resets impossible. So ids are derived
 * — UUIDv5 (SHA-1, RFC 4122) over a fixed namespace and a readable name.
 *
 * The name is intentionally human-readable (`sunset-ridge:customer:0042`) so a
 * row's id can be traced back to the line of the generator that produced it.
 */

import { createHash } from 'node:crypto';

/** Fixed namespace for the Bask demo dataset. Never change it — every id moves. */
export const BASK_NAMESPACE = '6f1f7d38-3b3f-5f0e-9a4a-2f8a1b6c5d40';

function uuidToBytes(uuid: string): Buffer {
  return Buffer.from(uuid.replace(/-/g, ''), 'hex');
}

const NAMESPACE_BYTES = uuidToBytes(BASK_NAMESPACE);

/** RFC 4122 §4.3 name-based UUID, SHA-1 flavour. */
export function uuid5(name: string, namespace: Buffer = NAMESPACE_BYTES): string {
  const hash = createHash('sha1').update(namespace).update(name, 'utf8').digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // RFC 4122 variant
  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/** `id('customer', 42)` → a stable uuid for that customer. */
export function id(kind: string, key: string | number): string {
  return uuid5(`${kind}:${key}`);
}

/** Zero-padded sequence key, so ids sort the way the rows were generated. */
export function seq(n: number, width = 4): string {
  return String(n).padStart(width, '0');
}
