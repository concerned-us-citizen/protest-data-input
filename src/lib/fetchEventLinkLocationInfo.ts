import { load } from 'cheerio';
import vm from 'vm';
import type { EventInfo, Nullable } from './types';
import { fetchHtml, formatDate } from './util';

export async function fetchEventLinkLocationInfo(url: string): Promise<Nullable<EventInfo>> {
	if (!url) {
		return null;
	}

	let hostname = '';
	try {
		const parsedUrl = new URL(url);
		hostname = parsedUrl.hostname;
	} catch {
		return null; // Invalid URL
	}

	if (hostname.includes('mobilize.us')) {
		return await fetchMobilizeEventLinkLocationInfo(url);
	} else {
		return null;
	}
}

async function fetchMobilizeEventLinkLocationInfo(url: string): Promise<Nullable<EventInfo>> {
	const html = await fetchHtml(url);
	const $ = load(html);

	const dataScript = $('script')
		.filter((_, el) => !!$(el).html()?.includes(`window.${'__MLZ_EMBEDDED_DATA__'}`))
		.first()
		.html();

	const dataScriptWithWindowDefined = `window = {};${dataScript}`;

	if (!dataScript) {
		return null;
	}

	const context: vm.Context = {};

	interface DateAndTimeRange {
		start: string;
		end: string;
	}

	function getStartDate(time: Nullable<DateAndTimeRange>, timezone: string) {
		try {
			if (!time) return '';
			const date = new Date(time.start);
			const fmt = new Intl.DateTimeFormat('en-US', {
				timeZone: timezone,
				month: '2-digit',
				day: '2-digit',
				year: 'numeric'
			});
			return fmt.format(date);
		} catch {
			return '';
		}
	}

	function getTimeOrRange(time: Nullable<DateAndTimeRange>, timezone: string) {
		if (!time) return '';
		if (time.start !== time.end) {
			return `${getTime(time.start, timezone)}-${getTime(time.end, timezone)}`;
		} else {
			return getTime(time.start, timezone);
		}
	}

	function getTime(dateString: string, timezone: string) {
		try {
			if (!dateString) return '';
			const date = new Date(dateString);
			const fmt = new Intl.DateTimeFormat('en-US', {
				timeZone: timezone,
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			});
			return fmt.format(date);
		} catch {
			return '';
		}
	}

	try {
		vm.runInNewContext(dataScriptWithWindowDefined, context);
		const embeddedData = context.window['__MLZ_EMBEDDED_DATA__'];
		const eventInfo = embeddedData.data.event as any;
		const timeRanges: DateAndTimeRange[] = eventInfo.times.map(
			(t: { start: string; end: string }) => ({
				start: t.start,
				end: t.end
			})
		);
		const firstTimeRange = timeRanges[0];
		return {
			date: getStartDate(firstTimeRange, eventInfo.timezone),
			time: getTimeOrRange(firstTimeRange, eventInfo.timezone),
			address: eventInfo.address_line1,
			zip: eventInfo.zipcode,
			city: eventInfo.city,
			state: eventInfo.state,
			country: eventInfo.country,
			name: eventInfo.name,
			link: eventInfo.event_details_native_share_shortlink,
			accessible: '', // TODO - unclear the codes mean
			recurring: '',
			coordinates: {
				lat: eventInfo.lat,
				lon: eventInfo.lon
			},
			organizer: eventInfo.organization.name
		};
	} catch (e) {
		console.error('Failed to evaluate JS', e);
	}

	return null;
}
