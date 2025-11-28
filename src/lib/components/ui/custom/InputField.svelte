<script lang="ts">
	import { X } from '@lucide/svelte';
	import type { ClassValue } from 'svelte/elements';
	import { Input } from '../input';
	import { cn } from '$lib/utils';

	let {
		id,
		class: className,
		value = $bindable(),
		placeholder = '',
		type = 'text',
		showClearButton = false,
		onBlur
	} = $props<{
		id?: string;
		class?: ClassValue;
		value: string;
		placeholder?: string;
		type?: string;
		showClearButton?: boolean;
		onBlur?: () => void;
	}>();
</script>

<div class={cn('relative w-full items-center', className)}>
	<Input
		{id}
		{type}
		name="notsearch_password"
		class="h-9 pr-8"
		bind:value
		{placeholder}
		onblur={onBlur}
	/>
	{#if showClearButton && value}
		<button
			type="button"
			class="absolute inset-y-0 right-0 flex items-center justify-center px-2"
			onclick={() => (value = '')}
			aria-label="Clear input"
		>
			<X class="text-muted-foreground size-4" />
		</button>
	{/if}
</div>
