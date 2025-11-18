<script lang="ts">
	import { z } from 'zod';
	import InputField from '$lib/components/ui/custom/InputField.svelte';
	import DatePickerField from '$lib/components/ui/custom/DatePickerField.svelte';
	import Step from '$lib/components/ui/custom/Step.svelte';
	import { BadgeCheck, ClipboardCopy } from '@lucide/svelte';
	import { toHtmlTableLine, toCsvLine, log } from '$lib/util';
	import type { EventInfo, Nullable } from '$lib/types';
	import { geocodeFromService } from '$lib/geocode';
	import { fetchWikiCityInfo } from '$lib/wikiCityInfo';
	import ActivitySpinner from '$lib/components/ActivitySpinner.svelte';
	import { CalendarDate } from '@internationalized/date';
	import FormField from '$lib/components/ui/custom/FormField.svelte';
	import EventNameField from '$lib/components/ui/custom/EventNameField.svelte';
	import LocationField from '$lib/components/ui/custom/LocationField.svelte';
	import StateField from '$lib/components/ui/custom/StateField.svelte';

	let source = $state<'event' | 'turnout'>('event');
	let mobilizeUrl = $state('');
	let mobilizeResult: Nullable<EventInfo> = $state(null);
	let fetchingFromMobilize = $state(false);
	let fetchFailed = $state(false);

	let verifyingAddressInfo = $state(false);
	let addressError: { description: string; link: string; linkTitle: string } | undefined = $state();

	let date = $state<CalendarDate | undefined>();
	let time = $state('');
	let address = $state('');
	let zip = $state('');
	let city = $state('');
	let stateName = $state('');
	let country = $state('US');
	let name = $state('');
	let link = $state('');
	let low = $state('');
	let high = $state('');
	let coverage = $state('');
	let accessible = $state('');
	let recurring = $state('');

	const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const fmt = new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		timeZone: tz
	});
	let dateString = $derived.by(() => {
		return fmt.format(date?.toDate(tz));
	});

	let lineItems = $derived.by(() => {
		return (
			source === 'event'
				? [
						dateString,
						time,
						address,
						zip,
						city,
						stateName,
						country,
						name,
						link,
						accessible,
						recurring
					]
				: [dateString, zip, city, stateName, name, low, high, link, coverage]
		).map((s) => (s ?? '').trim());
	});
	let html = $derived.by(() => {
		return toHtmlTableLine(lineItems);
	});
	let csv = $derived.by(() => {
		return toCsvLine(lineItems);
	});
	let copiedText: string | undefined = $state();

	let validateValues = $derived.by(() => {
		return {
			time,
			address,
			zip,
			city,
			state: stateName,
			country,
			name,
			link,
			low,
			high,
			coverage,
			accessible,
			recurring
		};
	});

	let canReset = $derived.by(() => {
		return (
			[
				time,
				address,
				zip,
				city,
				stateName,
				name,
				link,
				low,
				high,
				coverage,
				accessible,
				recurring
			].some((val) => val.length > 0) ||
			date !== undefined ||
			copiedText !== undefined
		);
	});

	let canCopy = $derived.by(() => {
		return [name, city, stateName].every((val) => val.length > 0) && date !== undefined;
	});

	let errors = $state<Record<string, string>>({});

	$effect(() => {
		if (date) {
			errors.date = '';
		}
	});

	$effect(() => {
		log(`csv: ${csv}`);
	});

	function urlOrEmpty(msg = 'Links must begin with http:// or https://') {
		return z
			.string()
			.refine((val) => val === '' || /^https?:\/\/.+/i.test(val), { message: msg })
			.optional();
	}

	function integerOrEmpty(label: string) {
		return z
			.string()
			.refine((val) => val === '' || /^\d+$/i.test(val), {
				message: `${label} must be blank or a whole number`
			})
			.optional();
	}

	const zipCodeOrEmpty = z
		.string()
		.refine((val) => val === '' || /^(?:\d{5})?$/.test(val), {
			message: 'ZIP code must a 5 digit number or blank'
		})
		.optional();

	const schema = z
		.object({
			zip: zipCodeOrEmpty,
			link: urlOrEmpty(),
			coverage: urlOrEmpty(),
			low: integerOrEmpty('Low'),
			high: integerOrEmpty('High')
		})
		.refine((data) => !data.low || !data.high || Number(data.low) <= Number(data.high), {
			message: 'High must be greater than or equal to Low',
			path: ['high']
		});

	function validateField(field: keyof typeof validateValues) {
		const result = schema.safeParse(validateValues);
		errors[field] = '';
		if (!result.success) {
			const issue = result.error.issues.find((i) => i.path[0] === field);
			if (issue) errors[field] = issue.message;
		}
	}

	async function validateAll(): Promise<boolean> {
		const result = schema.safeParse(validateValues);
		errors = {};
		let badFields = false;
		if (!result.success) {
			for (const issue of result.error.issues) {
				errors[issue.path[0] as string] = issue.message;
			}
			badFields = true;
		}

		if (!date) {
			errors.date = date ? '' : 'No date selected';
			badFields = true;
		}

		if (badFields) return false;

		verifyingAddressInfo = true;
		// They have an address, see if we can geocode it
		if (address.trim().length > 0) {
			try {
				const _result = await geocodeFromService({
					address,
					zip,
					city,
					state: stateName
				});
			} catch (e) {
				addressError = {
					description: 'Could not get a location for this address, is it an actual address?',
					link: `https://duckduckgo.com/?q=${encodeURIComponent(`${address} ${city}, ${stateName} ${zip}`)}`,
					linkTitle: 'Search DuckDuckGo'
				};
				verifyingAddressInfo = false;
				return false;
			}
		} else {
			// Otherwise look at wikipedia for city and state
			const cityInfo = await fetchWikiCityInfo(city, stateName);
			if (!cityInfo) {
				addressError = {
					description: `Could not find a direct Wikipedia link for ${city}, ${stateName} (Is the name ambiguous? mispelled?, wrong state?) `,
					link: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(`${city}, ${stateName}`)}`,
					linkTitle: 'Search Wikipedia'
				};
				verifyingAddressInfo = false;
				return false;
			}
		}
		verifyingAddressInfo = false;

		return result.success;
	}

	async function copyToClipboard() {
		addressError = undefined;

		// We have to do this first, to keep it on the same activation as the user click for safari's sake.
		// Not strictly correct...
		await navigator.clipboard.write([
			new ClipboardItem({
				'text/html': new Blob([html], { type: 'text/html' }),
				'text/plain': new Blob([csv], { type: 'text/plain' })
			})
		]);
		if (!(await validateAll())) return;
		copiedText = csv;
	}

	async function populateFromMobilize(event: SubmitEvent) {
		event.preventDefault();
		fetchingFromMobilize = true;
		mobilizeResult = null;
		fetchFailed = false;

		const res = await fetch('/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ urlText: mobilizeUrl })
		});

		mobilizeResult = null;
		fetchFailed = true;

		if (res.ok) {
			const data = await res.json();
			if (data.result) {
				mobilizeResult = data.result as EventInfo;

				const rawDate = new Date(mobilizeResult.date);
				date = new CalendarDate(rawDate.getFullYear(), rawDate.getMonth() + 1, rawDate.getDate());

				address = mobilizeResult.address ?? '';
				zip = mobilizeResult.zip ?? '';
				city = mobilizeResult.city ?? '';
				stateName = mobilizeResult.state ?? '';
				name = mobilizeResult.name ?? '';
				link = mobilizeResult.link ?? '';
				time = mobilizeResult.time ?? '';
				country = mobilizeResult.country ?? '';

				fetchFailed = false;
			}
		}

		fetchingFromMobilize = false;
	}

	function handleReset() {
		date = undefined;
		address = '';
		zip = '';
		city = '';
		stateName = '';
		name = '';
		link = '';
		time = '';
		country = 'US';
		mobilizeUrl = '';
		copiedText = undefined;
		addressError = undefined;
	}
</script>

<div class="flex max-w-2xl flex-col p-8">
	<div class="flex flex-row items-start justify-between gap-5">
		<div class="mb-5 flex flex-col">
			<h1 class="text-xl font-bold">Protest Data Input Form</h1>
			<div class="text-sm italic">
				Creates clipboard row content for We (The People) Dissent spreadsheets.
			</div>
		</div>
		{#if canReset}
			<button
				class="cursor-pointer rounded bg-orange-600 px-4 py-2 text-white"
				onclick={handleReset}>Reset</button
			>
		{/if}
	</div>
	<div class=" flex-col gap-6">
		<Step
			stepNumber={1}
			label="Choose an entry type"
			description="Specifies which kind of spreadsheet row you're creating - a protest event or turnout numbers."
		>
			<fieldset class="flex gap-4">
				<label><input type="radio" name="sources" value="event" bind:group={source} /> Event</label>
				<label
					><input type="radio" name="sources" value="turnout" bind:group={source} /> Turnout</label
				>
			</fieldset>
		</Step>

		<Step
			stepNumber={2}
			label="(Optional) Enter a mobilize.us URL"
			description="For mobilize.us sources, we'll attempt to fill in values from the given URL. This should work if the event is in the future."
		>
			<form onsubmit={populateFromMobilize} class="w-full">
				<div class="flex w-full flex-row flex-wrap items-center gap-2">
					<InputField
						id="mobilize-url"
						class="min-w-48 flex-1"
						placeholder="https://www.mobilize.us/mobilize/event/EVENT_NUMBER/"
						bind:value={mobilizeUrl}
					/>
					<button
						type="submit"
						class="ml-auto shrink-0 cursor-pointer rounded bg-blue-600 px-3 py-1 text-white"
					>
						Fetch Values
					</button>
					{#if fetchingFromMobilize}
						<ActivitySpinner label={`Fetching data from Mobilize.us...`} />
					{/if}
				</div>
			</form>
			{#if !fetchingFromMobilize && fetchFailed}
				<div class="my-3 text-red-500">Unable to retrieve event info (maybe a stale event?).</div>
			{/if}
		</Step>

		<Step
			stepNumber={3}
			label="Enter values"
			description="Fields not marked with an asterix are optional."
		>
			<form class="space-y-4">
				<div class="flex flex-col gap-3">
					<div class="flex flex-row gap-3">
						<FormField label="Date" required error={errors.date} class="w-32">
							<DatePickerField id="date" bind:value={date} />
						</FormField>
						{#if source === 'event'}
							<FormField label="Time" class="w-44">
								<InputField id="time" onBlur={() => validateField('time')} bind:value={time} />
							</FormField>
						{/if}
					</div>

					<FormField label="Event Name" required>
						<EventNameField id="ff_ev_nm" bind:name />
					</FormField>

					{#if source === 'event'}
						<FormField label="Street Address" error={errors.address}>
							<InputField
								id="ff_loc_a"
								onBlur={() => validateField('address')}
								bind:value={address}
							/>
						</FormField>
					{/if}

					<div class="flex flex-row flex-wrap items-end gap-3">
						<FormField
							class="min-w-48 flex-1"
							label="Region (City, County, Park, etc.)"
							required
							error={errors.city}
						>
							<LocationField id="ff_loc" bind:city bind:stateName />
						</FormField>
						<div class="flex flex-row flex-wrap items-end gap-3">
							<FormField label="State" required error={errors.state} class="w-18">
								<StateField id="ff_st" bind:stateName />
							</FormField>
							<FormField label="Zip" error={errors.zip} class="w-20">
								<InputField id="zip" onBlur={() => validateField('zip')} bind:value={zip} />
							</FormField>
							<FormField label="Country" class="w-14">
								<InputField
									id="country"
									onBlur={() => validateField('country')}
									bind:value={country}
								/>
							</FormField>
						</div>
					</div>
					<FormField label="Event URL" error={errors.link}>
						<InputField
							id="event-url"
							placeholder="https://your_event_source.com"
							bind:value={link}
							onBlur={() => validateField('link')}
						/>
					</FormField>
					{#if source === 'turnout'}
						<div class="flex flex-row gap-3">
							<FormField label="Low Estimate" error={errors.low} class="w-24">
								<InputField id="low" bind:value={low} onBlur={() => validateField('low')} />
							</FormField>
							<FormField label="High Estimate" error={errors.high} class="w-24">
								<InputField id="high" bind:value={high} onBlur={() => validateField('high')} />
							</FormField>
						</div>
						<FormField label="News Coverage" error={errors.coverage}>
							<InputField
								id="coverage-url"
								bind:value={coverage}
								placeholder="https://your_news_source.com"
								onBlur={() => validateField('coverage')}
							/>
						</FormField>
					{/if}
				</div>
			</form>
		</Step>

		{#if canCopy}
			<Step
				stepNumber={4}
				label="Validate and copy to the clipboard"
				description="Verify fields are properly formatted and that location is recognizable, then copies the data to the clipboard as a spreadsheet row."
			>
				<button
					class="flex cursor-pointer flex-row flex-nowrap items-center gap-1 rounded bg-blue-600 px-4 py-2 text-white"
					onclick={() => copyToClipboard()}
					><ClipboardCopy /> Validate and Copy
				</button>
				{#if verifyingAddressInfo}
					<div>
						<ActivitySpinner
							label={`Verifying ${address.length > 0 ? 'address' : 'city and state'}...`}
						/>
					</div>
				{/if}

				{#if copiedText}
					<div class="mt-6 flex flex-row items-start justify-between">
						<div>
							<div class="mb-3 font-bold">Looks good! Copied the following to your clipboard:</div>
							{copiedText}
						</div>
						<BadgeCheck size="50" class="stroke-green-500" />
					</div>
				{/if}
			</Step>

			{#if copiedText}
				<Step stepNumber={5} label="Paste into Excel or Google Sheets"></Step>
			{/if}
		{/if}

		{#if addressError}
			<div class="full-width flex flex-col items-end gap-1">
				<div class="text-red-500">{addressError.description}</div>
				<a class="underline" href={addressError.link} target="_blank" rel="noopener"
					>{addressError.linkTitle}</a
				>
			</div>
		{/if}
	</div>
	<div class="mt-10 self-center">
		<a class="text-blue-500 hover:underline" href="mailto:support@protestmap.info?subject=Feedback"
			>Please email</a
		> issues you encounter or suggestions you might have.
	</div>
</div>
