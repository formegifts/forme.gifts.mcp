// Drops undefined/null/empty-string values from an object before sending it as
// RPC params or an UPDATE patch. Optional `rename` map lets the caller spell
// keys for the wire format (e.g. `name` → `p_name`) without a second pass.
export const omitEmpty = <K extends string>(
  src: Partial<Record<K, unknown>>,
  rename: Partial<Record<K, string>> = {}
): Record<string, unknown> => {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(src) as K[]) {
    const value = src[key]
    if (value === undefined || value === null || value === '') continue
    out[rename[key] ?? key] = value
  }
  return out
}
