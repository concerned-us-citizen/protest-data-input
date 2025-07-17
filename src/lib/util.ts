export async function fetchHtml(url: string): Promise<string> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
	return await res.text();
}

export function formatDate(
	date: Date | undefined,
	verbosity: 'short' | 'medium' | 'long' = 'long'
): string {
	if (!(date instanceof Date) || isNaN(+date)) return '';

	const sameYear = date.getFullYear() === new Date().getFullYear();

	// Base options for the three verbosities
	const base: Record<'short' | 'medium' | 'long', Intl.DateTimeFormatOptions> = {
		short: { month: 'numeric', day: 'numeric', year: 'numeric' },
		medium: { month: 'short', day: 'numeric', year: 'numeric' },
		long: { month: 'long', day: 'numeric', year: 'numeric' }
	};

	// Copy the right template and drop the year if it matches the current year
	const opts = { ...base[verbosity] };
	if (sameYear) delete opts.year;

	return date.toLocaleDateString('en-US', opts);
}

export function toCsvLine(values: string[]): string {
	return values
		.map((val) => {
			if (val.includes('"') || val.includes(',') || val.includes('\n')) {
				// Escape double quotes by doubling them
				const escaped = val.replace(/"/g, '""');
				return `"${escaped}"`;
			}
			return val;
		})
		.join(',');
}

export async function safeCopyToClipboard(text: string) {
	try {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(text);
		} else {
			// Fallback using older execCommand API
			const textarea = document.createElement('textarea');
			textarea.value = text;
			textarea.setAttribute('readonly', '');
			textarea.style.position = 'absolute';
			textarea.style.left = '-9999px';
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
		}
	} catch (err) {
		console.error('Copy failed:', err);
	}
}
