<script lang="ts">
	import { log } from '$lib/util';
	import { Combobox } from 'bits-ui';
	import type { ClassValue } from 'clsx';
	import { tick } from 'svelte';

	let {
		id,
		class: className,
		value,
		inputValue = $bindable<string>(),
		options,
		onSelect,
		placeholder = '',
		allowCustomInput = false
	} = $props<{
		id?: string;
		class?: ClassValue;
		value?: string;
		inputValue: string;
		options: string[];
		onSelect?: (selectedValue: string) => void;
		placeholder?: string;
		allowCustomInput?: boolean;
	}>();

	let focused = $state(false);
	let trimmedInputValue = $derived(inputValue.trim());
	let open = $derived.by(() => focused && trimmedInputValue.length > 0);
	let optionsWithInput = $derived.by(() => {
		return !allowCustomInput || options[0] === trimmedInputValue
			? options
			: [trimmedInputValue, ...options];
	});

	function commit(v: string, reason: string) {
		log(
			`Typeahead[${id}].commit(${reason}), before onSelect: v='${v}' trimmedInputValue='${trimmedInputValue}' focused='${focused}' open='${open}'`
		);

		onSelect?.(v);

		log(
			`Typeahead[${id}].commit(${reason}), after onSelect: v='${v}' trimmedInputValue='${trimmedInputValue}' focused='${focused}' open='${open}'`
		);
	}

	$effect(() => {
		inputValue = value;
		log(`Typeahead[${id}].effect: setting inputValue to value, value='${value}'`);
	});
</script>

<Combobox.Root
	type="single"
	{value}
	{open}
	{inputValue}
	onValueChange={(newValue) => {
		log(`Typeahead[${id}].onValueChange: newValue='${newValue}'`);
		tick().then(() => {
			commit(newValue, 'VALUECHANGE');
		});
	}}
>
	<Combobox.Input
		{id}
		{placeholder}
		autocomplete="off"
		class={[
			'border-input bg-background selection:bg-primary dark:bg-input/30 selection:text-primary-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
			className
		]}
		oninput={(e) => {
			inputValue = e.currentTarget.value;
			log(`Typeahead[${id}].oninput: inputValue='${inputValue}'`);
		}}
		onfocus={() => {
			focused = true;
			inputValue = value;
			log(`Typeahead[${id}].onfocus: inputValue ='${inputValue}' value='${value}'`);
		}}
		onblur={() => {
			log(`Typeahead[${id}].onblur before commit: inputValue ='${inputValue}' value='${value}'`);
			if (allowCustomInput) {
				commit(inputValue, 'BLUR');
			} else {
				if (inputValue.length > 0 && options.length > 0) {
					commit(options[0], 'BLUR');
				} else {
					commit('', 'BLUR');
				}
			}
			focused = false;
			log(`Typeahead[${id}].onblur after commit: inputValue ='${inputValue}' value='${value}'`);
		}}
	/>

	<Combobox.Portal>
		<Combobox.Content
			sideOffset={2}
			align="start"
			class="bg-background z-50 max-h-60
         w-auto max-w-[32rem] min-w-[var(--bits-combobox-anchor-width)]
         overflow-auto rounded border shadow"
		>
			<Combobox.Viewport>
				{#each optionsWithInput as opt}
					<Combobox.Item
						value={opt}
						label={opt}
						onHighlight={() => {
							log(`Typeahead[${id}].onHighlight opt='${opt}'`);
						}}
						class="data-highlighted:bg-muted cursor-pointer px-3 py-2"
					>
						{opt}
					</Combobox.Item>
				{/each}
			</Combobox.Viewport>
		</Combobox.Content>
	</Combobox.Portal>
</Combobox.Root>
