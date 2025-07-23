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

<Input
	{id}
	{type}
	name="notsearch_password"
	class={className}
	bind:value
	{placeholder}
	onblur={onBlur}
/>
