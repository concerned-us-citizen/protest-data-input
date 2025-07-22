<script lang="ts">
	import { debounce } from '$lib/client/debounce';
	import { getMatchingEventNames } from '$lib/client/getValues';
	import TypeaheadField from './TypeaheadField.svelte';

	let { id, name = $bindable<string>() } = $props<{
		id: string;
		name: string;
	}>();

	let eventNameQuery = $state('');
	let eventNameMatchesForName = $state<string[]>([]);
	const fetchEventMatches = async (q: string, opts?: { signal: AbortSignal }) => {
		eventNameMatchesForName = await getMatchingEventNames(q, opts);
	};
	const debouncedFetchEventNameMatches = debounce(fetchEventMatches, 300);
	$effect(() => {
		debouncedFetchEventNameMatches(eventNameQuery);
	});

	$effect(() => {
		eventNameQuery = name;
	});
</script>

<TypeaheadField
	{id}
	value={name}
	bind:inputValue={eventNameQuery}
	options={eventNameMatchesForName}
	allowCustomInput
	onSelect={(selectedValue: string) => {
		name = selectedValue;
	}}
/>
