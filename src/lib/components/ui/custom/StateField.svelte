<script lang="ts">
	import { states } from '$lib/usStateInfo';
	import { log } from '$lib/util';

	import TypeaheadField from './TypeaheadField.svelte';

	let { id, stateName = $bindable<string>() } = $props<{
		id: string;
		stateName: string;
	}>();

	let stateQuery = $state('');
	let stateOptions = $derived.by(() => {
		const q = stateQuery.trim().toLowerCase();

		return states
			.filter(({ fullName, abbreviation }) =>
				`${fullName} (${abbreviation})`.toLowerCase().includes(q)
			)
			.sort((a, b) => {
				const aAbbrMatch = a.abbreviation.toLowerCase() === q;
				const bAbbrMatch = b.abbreviation.toLowerCase() === q;
				if (aAbbrMatch !== bAbbrMatch) return aAbbrMatch ? -1 : 1;
				return a.fullName.localeCompare(b.fullName);
			})
			.map(({ fullName, abbreviation }) => `${fullName} (${abbreviation})`);
	});
</script>

<TypeaheadField
	{id}
	value={stateName}
	bind:inputValue={stateQuery}
	options={stateOptions}
	onSelect={(selectedStateName: string) => {
		log(
			`stateName.onSelect selectedStateName='${selectedStateName}' stateName='${stateName}' stateQuery='${stateQuery}'`
		);
		// Match either 'AZ' or 'Tucson (AZ)'
		const result = selectedStateName.match(/(?:\(|^)([A-Z]{2})(?=\)?$)/i)?.[1] ?? '';
		stateName = result;
		stateQuery = stateName;
		log(`after set, stateName='${stateName}' stateQuery='${stateQuery}'`);
	}}
/>
