<script lang="ts">
	import type { EventInfo, Nullable } from '$lib/types';
	import { safeCopyToClipboard, toCsvLine } from '$lib/util';
	import { ClipboardCopy } from '@lucide/svelte';
	import { tick } from 'svelte';

	let urlText = $state('https://www.mobilize.us/mobilize/event/808563/');
	let eventInfo: Nullable<EventInfo> = $state(null);
	let displayedEventInfo = $derived.by(() => {
		return eventInfo === null ? '' : JSON.stringify(eventInfo, null, 2);
	});
	let csv = $derived.by(() => {
		return eventInfo === null
			? ''
			: toCsvLine([
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
					eventInfo.recurring,
					'' + (eventInfo.coordinates?.lat ?? ''),
					'' + (eventInfo.coordinates?.lon ?? '')
				]);
	});
	let working = $state(false);
	let copiedText: string | undefined = $state();

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		working = true;
		eventInfo = null;

		const res = await fetch('/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ urlText })
		});

		if (res.ok) {
			eventInfo = (await res.json()).result as EventInfo;
		} else {
			eventInfo = null;
		}

		working = false;
	}

	async function copyToClipboard() {
		await safeCopyToClipboard(csv);
		copiedText = csv;

		// Wait a bit, then clear the message
		await tick();
		setTimeout(() => {
			copiedText = undefined;
		}, 5000);
	}
</script>

<div class="m-8">
	<form onsubmit={handleSubmit}>
		<label for="url" class="mb-1 block font-medium">Source URL</label>
		<input
			id="url"
			type="text"
			bind:value={urlText}
			placeholder="Enter a protest url"
			required
			class="w-128 rounded border px-2"
		/>
		<button type="submit" class="ml-2 cursor-pointer rounded bg-blue-600 px-3 py-1 text-white">
			Submit
		</button>
	</form>
</div>

{#if working}
	<p class="mt-4 text-gray-500 italic">Working…</p>
{:else if eventInfo}
	<pre class="mt-4 font-semibold text-green-700">{displayedEventInfo}</pre>
	<button
		class="ml-2 cursor-pointer rounded bg-blue-600 px-3 py-1 text-white"
		onclick={() => copyToClipboard()}
		><ClipboardCopy /> Copy CSV
	</button>
{/if}

{#if copiedText}
	<div class="copied-popup">
		Copied to clipboard:
		<div class="mt-4">{copiedText}'</div>
	</div>
{/if}
