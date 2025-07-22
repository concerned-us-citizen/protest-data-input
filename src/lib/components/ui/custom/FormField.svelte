<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	let {
		label,
		required = false,
		class: className,
		error = '',
		children
	} = $props<{
		label: string;
		required?: boolean;
		class?: ClassValue;
		error?: string;
		children: Snippet;
	}>();
</script>

<label class={['block', className]}>
	<div class="flex flex-row items-center gap-1 text-sm">
		{label}
		{#if required}
			<span class="text-sm text-red-500">*</span>
		{/if}
	</div>
	{@render children()}
	{#if error}
		<p class="text-sm text-red-500">{error}</p>
	{/if}
</label>
