// src/lib/server/fetch-store.ts
let serverFetch: typeof fetch | undefined;
export function setServerFetch(f: typeof fetch) {
	serverFetch = f;
}
export function getServerFetch() {
	if (!serverFetch) throw new Error('serverFetch not set yet');
	return serverFetch;
}
