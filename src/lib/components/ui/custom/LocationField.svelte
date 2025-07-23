<script lang="ts">
	import { debounce } from '$lib/client/debounce';
	import { getMatchingLocations } from '$lib/client/getValues';
	import { getStateInfo } from '$lib/usStateInfo';
	import { log } from '$lib/util';
	import { onMount } from 'svelte';
	import TypeaheadField from './TypeaheadField.svelte';

	let {
		id,
		city = $bindable<string>(),
		stateName = $bindable<string>()
	} = $props<{
		id: string;
		city: string;
		stateName: string;
	}>();

	let locationQuery = $state('');
	let locationMatchesForCity = $state<string[]>([]);

	const fetchLocationMatches = async (q: string, opts?: { signal: AbortSignal }) => {
		locationMatchesForCity = await getMatchingLocations(q, opts);
	};
	const debouncedFetchLocationMatches = debounce(fetchLocationMatches, 300);
	$effect(() => {
		debouncedFetchLocationMatches(locationQuery);
	});

	$effect(() => {
		locationQuery = city;
		log(`LocationField.locationQuery update, updated locationQuery to: city='${city}'`);
	});

	// Warm up the server so the first autocomplete is responsive
	onMount(() => {
		debouncedFetchLocationMatches('warmup');
	});
</script>

<TypeaheadField
	{id}
	value={city}
	bind:inputValue={locationQuery}
	options={locationMatchesForCity}
	allowCustomInput
	onSelect={(selectedValue: string) => {
		const [selectedCity, selectedState] = selectedValue.split(',').map((s) => s.trim());
		log(
			`LocationField.onSelect before: city='${city}' stateName='${stateName}' selectedValue='${selectedValue}' selectedCity='${selectedCity}' selectedState='${selectedState}' locationQuery='${locationQuery}'`
		);
		city = selectedCity;
		locationQuery = selectedCity;
		if (selectedState) {
			let abbreviation = getStateInfo(selectedState)?.abbreviation;
			if (abbreviation) {
				stateName = abbreviation;
			}
		}
		log(
			`LocationField.onSelect after: city='${city}' stateName='${stateName}' locationQuery='${locationQuery}'`
		);
	}}
/>
