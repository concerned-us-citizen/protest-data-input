import type { HandleServerError } from '@sveltejs/kit';
import { setServerFetch } from '$lib/server/fetchStore';

export const handleError: HandleServerError = ({ error, event }) => {
	console.error('[500]', event.request.method, event.url.href, error);
	return { message: 'Internal error' }; // what gets exposed to the client
};

export const handle = async ({ event, resolve }) => {
	setServerFetch(event.fetch);
	return resolve(event);
};
