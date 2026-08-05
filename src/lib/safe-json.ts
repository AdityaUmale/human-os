/**
 * Parse Response body as JSON without throwing on empty/invalid bodies.
 */
export async function readJsonSafe<T = unknown>(
  res: Response,
): Promise<{ data: T | null; raw: string; ok: boolean }> {
  const raw = await res.text();
  if (!raw.trim()) {
    return { data: null, raw: "", ok: false };
  }
  try {
    return { data: JSON.parse(raw) as T, raw, ok: true };
  } catch {
    return { data: null, raw, ok: false };
  }
}

export async function readJsonOrThrow<T = unknown>(res: Response): Promise<T> {
  const { data, raw, ok } = await readJsonSafe<T>(res);
  if (!ok || data === null) {
    throw new Error(
      raw.trim()
        ? `Invalid JSON response (${res.status}): ${raw.slice(0, 200)}`
        : `Empty response from server (${res.status} ${res.statusText || "error"})`,
    );
  }
  return data;
}
