<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	let {
		class: className,
		stepNumber,
		label,
		description,
		children
	} = $props<{
		class?: ClassValue;
		stepNumber: number;
		label: string;
		description?: string;
		children?: Snippet;
	}>();
</script>

<div class={['mt-4', className]}>
	<div class="mb-1 font-bold">{stepNumber}) {label}</div>
	<div class="rounded bg-gray-50 p-4">
		<div class="mb-2 text-sm italic">{description}</div>
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>
