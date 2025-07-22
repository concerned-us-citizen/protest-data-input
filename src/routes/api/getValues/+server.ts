import { json, error, type RequestHandler } from '@sveltejs/kit';
import { EventDb } from '$lib/server/EventDb';

type ValueType = 'location' | 'eventName';

interface Body {
	query: string;
	valueType: ValueType;
}

export const POST: RequestHandler = async ({ request }) => {
	let body: Body;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Body must be valid JSON');
	}

	const { query, valueType } = body;
	if (!query?.trim()) throw error(400, 'query is required');
	if (valueType !== 'location' && valueType !== 'eventName') {
		throw error(400, "valueType must be 'location' or 'eventName'");
	}

	const db = await EventDb.get();
	const values =
		valueType === 'location' ? db.getMatchingLocations(query) : db.getMatchingEventNames(query);

	return json({ values });
};
