export function debounce<T extends (...a: any[]) => any>(fn: T, delay = 250) {
	let timer: ReturnType<typeof setTimeout> | null = null;
	let lastAbort: AbortController | null = null;

	// Wrapped function keeps the same signature as `fn`
	return (...args: Parameters<T>) => {
		// Abort the previous request if one is still in‑flight
		if (lastAbort) lastAbort.abort();

		// Replace the AbortController in the final argument if caller passes one
		const ac = new AbortController();
		lastAbort = ac;

		// ‑‑ reset / start timer
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			// add the controller’s signal as the last arg, or merge into options
			const last = args[args.length - 1];
			if (typeof last === 'object' && last?.signal === undefined) {
				(args as any)[args.length - 1] = { ...last, signal: ac.signal };
			} else {
				(args as any).push({ signal: ac.signal });
			}
			fn(...args);
			timer = null;
		}, delay);
	};
}
