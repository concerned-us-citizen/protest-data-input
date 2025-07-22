<script lang="ts">
	let { label } = $props<{
		label: string;
	}>();
</script>

<div class="flex flex-row flex-nowrap items-center gap-3">
	<div
		class="h-6 w-6 animate-spin rounded-full border-2 border-solid border-transparent"
		style="border-top-color: currentColor;"
	></div>
	<div>{label}</div>
</div>
