<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import { Input } from '../input';

	let {
		id,
		class: className,
		value = $bindable(),
		placeholder = '',
		type = 'text',
		onBlur
	} = $props<{
		id?: string;
		class?: ClassValue;
		value: string;
		placeholder?: string;
		type?: string;
		onBlur?: () => void;
	}>();
</script>

<Input {id} {type} class={className} bind:value {placeholder} onblur={onBlur} />
