import { browser } from '$app/environment';

type ValueType = 'location' | 'eventName';

interface CacheEntry {
	values: string[];
	timestamp: number;
}

const CACHE_TTL_MS = 60_000; // 1 min
const cache: Record<string, CacheEntry> = {};

/**
 * Fetch up to 20 values from `/api/getValues`.
 * Transparently caches responses for a minute.
 *
 * @param query      The user’s search term (case‑insensitive)
 * @param valueType  'location' | 'eventName'
 */
export async function getValues(
	query: string,
	valueType: ValueType,
	opts: { signal?: AbortSignal } = {}
): Promise<string[]> {
	if (!browser || !query.trim()) return [];

	const key = `${valueType}:${query.toLowerCase()}`;

	const hit = cache[key];
	if (hit && Date.now() - hit.timestamp < CACHE_TTL_MS) return hit.values;

	const res = await fetch('/api/getValues', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query, valueType }),
		signal: opts.signal
	});

	if (!res.ok) throw new Error(await res.text());
	const { values } = (await res.json()) as { values: string[] };

	// 4. store in cache & return
	cache[key] = { values, timestamp: Date.now() };
	return values;
}

const safeGet = async (
	query: string,
	valueType: ValueType,
	opts?: { signal?: AbortSignal }
): Promise<string[]> => {
	try {
		return await getValues(query, valueType, opts);
	} catch (err) {
		if (err instanceof DOMException && err.name === 'AbortError') return [];
		throw err;
	}
};

const makeMatcher = (type: ValueType) => (query: string, opts?: { signal?: AbortSignal }) =>
	safeGet(query, type, opts);

export const getMatchingLocations = makeMatcher('location');
export const getMatchingEventNames = makeMatcher('eventName');
