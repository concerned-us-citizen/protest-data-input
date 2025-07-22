<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import Calendar from '$lib/components/ui/calendar/calendar.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { type DateValue } from '@internationalized/date';
	import { CalendarIcon } from '@lucide/svelte';
	import { cn } from 'tailwind-variants';

	let {
		id,
		class: className,
		value = $bindable(),
		onBlur
	} = $props<{
		id?: string;
		class?: ClassValue;
		value: DateValue | undefined;
		onBlur?: () => void;
	}>();

	let open = $state(false);
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				{id}
				variant="outline"
				onblur={onBlur}
				class={cn(
					className,
					'w-[280px] justify-start text-left font-normal',
					!value && 'text-muted-foreground'
				)}
				{...props}
			>
				<CalendarIcon class="size-4" />
				{value ? value : 'Select a date'}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-auto p-0">
		<Calendar bind:value type="single" initialFocus onValueChange={() => (open = false)} />
	</Popover.Content>
</Popover.Root>
