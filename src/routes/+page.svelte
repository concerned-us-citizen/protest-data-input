<script lang="ts">
	import type { EventInfo, Nullable } from '$lib/types';
	import { toHtmlTableLine, toCsvLine } from '$lib/util';
	import { ClipboardCopy } from '@lucide/svelte';
	import { tick } from 'svelte';

	let urlText = $state('');
	let eventInfo: Nullable<EventInfo> = $state(null);
	let displayedEventInfo = $derived.by(() => {
		return eventInfo === null ? '' : JSON.stringify(eventInfo, null, 2);
	});
	let fetchFailed = $state(false);

	let lineItems = $derived.by(() => {
		return eventInfo === null
			? []
			: [
					eventInfo.date,
					eventInfo.time,
					eventInfo.address,
					eventInfo.zip,
					eventInfo.city,
					eventInfo.state,
					eventInfo.country,
					eventInfo.name,
					eventInfo.link,
					eventInfo.accessible,
					eventInfo.recurring
				];
	});
	let html = $derived.by(() => {
		return toHtmlTableLine(lineItems);
	});
	let csv = $derived.by(() => {
		return toCsvLine(lineItems);
	});
	let working = $state(false);
	let copiedText: string | undefined = $state();

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		working = true;
		eventInfo = null;
		fetchFailed = false;

		const res = await fetch('/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ urlText })
		});

		eventInfo = null;
		fetchFailed = true;
		if (res.ok) {
			const data = await res.json();
			if (data.result) {
				eventInfo = data.result as EventInfo;
				fetchFailed = false;
			}
		}

		working = false;
	}

	async function copyToClipboard() {
		await navigator.clipboard.write([
			new ClipboardItem({
				'text/html': new Blob([html], { type: 'text/html' }),
				'text/plain': new Blob([csv], { type: 'text/plain' })
			})
		]);
		copiedText = csv;

		// Wait a bit, then clear the message
		await tick();
		setTimeout(() => {
			copiedText = undefined;
		}, 5000);
	}
</script>

<div class="m-8">
	<form onsubmit={handleSubmit} class="w-full">
		<div class="flex w-full max-w-[30rem] flex-row flex-nowrap items-center">
			<input
				id="url"
				type="text"
				bind:value={urlText}
				placeholder="Enter mobile.us URL"
				required
				class="flex-1 rounded border px-2"
			/>
			<button
				type="submit"
				class="ml-2 flex-none cursor-pointer rounded bg-blue-600 px-3 py-1 text-white"
			>
				Submit
			</button>
		</div>
	</form>

	<div class="mt-4">
		{#if working}
			<p class="text-gray-500 italic">Working…</p>
		{:else if eventInfo}
			<pre class="mt-4 font-semibold text-green-700">{displayedEventInfo}</pre>
			<button
				class="mt-2 flex cursor-pointer flex-row flex-nowrap items-center gap-1 rounded bg-blue-600 px-3 py-1 text-white"
				onclick={() => copyToClipboard()}
				><ClipboardCopy /> Copy CSV
			</button>
		{:else if fetchFailed}
			<div class="font-bold">Unable to retrieve event info (maybe a stale event?).</div>
		{/if}
	</div>

	{#if copiedText}
		<div class="mt-4">
			<div class="font-bold">Copied to clipboard, suitable for Excel or Google Sheets:</div>

			<div class="mt-1 rounded-md bg-gray-300 p-5">{copiedText}</div>
		</div>
	{/if}
</div>
