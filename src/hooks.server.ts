import type { HandleServerError } from '@sveltejs/kit';

export const handleError: HandleServerError = ({ error, event }) => {
	console.error('[500]', event.request.method, event.url.href, error);
	return { message: 'Internal error' }; // what gets exposed to the client
};
