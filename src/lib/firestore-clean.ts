/**
 * Firestore rejects `undefined` values anywhere in a document. Optional fields
 * that resolve to `undefined` therefore have to be stripped before any
 * `setDoc`/`addDoc`/`updateDoc` write.
 *
 * `cleanForFirestore` walks the input recursively (arrays + plain objects) and
 * returns a new value with every `undefined` removed. Non-plain objects (Date,
 * Timestamp, etc.) are passed through untouched.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function cleanForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      if (v === undefined) continue;
      out[key] = cleanForFirestore(v);
    }
    return out as T;
  }
  return value;
}
