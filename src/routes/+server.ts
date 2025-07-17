import { fetchEventLinkLocationInfo } from '$lib/fetchEventLinkLocationInfo';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	const { urlText } = await request.json();

	const result = await fetchEventLinkLocationInfo(urlText);
	if (result) {
		return json({ result });
	} else {
		return json({ failure: `Unable to retrieve data for ${urlText}` });
	}
};
