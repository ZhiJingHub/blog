<script lang="ts">
	import { Slider as SliderPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { ClassValue } from 'clsx';

	let {
		ref = $bindable(null),
		value = $bindable(),
		type = 'single',
		class: className,
		...restProps
	}: {
		ref?: HTMLSpanElement | null;
		value?: number | number[];
		type?: 'single' | 'multiple';
		class?: ClassValue;
		[key: string]: unknown;
	} = $props();
</script>

<SliderPrimitive.Root
	bind:ref
	bind:value={value as never}
	{type}
	data-slot="slider"
	class={cn(
		'relative flex w-full touch-none items-center select-none data-disabled:opacity-50',
		className
	)}
	{...restProps}
>
	{#snippet children({ thumbItems })}
		<span
			data-slot="slider-track"
			class="relative h-3 w-full grow overflow-hidden rounded-4xl bg-muted"
		>
			<SliderPrimitive.Range data-slot="slider-range" class="absolute h-full bg-primary" />
		</span>
		{#each thumbItems as thumb (thumb)}
			<SliderPrimitive.Thumb
				data-slot="slider-thumb"
				index={thumb.index}
				class="block size-4 shrink-0 rounded-4xl border border-primary bg-white shadow-sm ring-ring/50 transition-colors hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden"
			/>
		{/each}
	{/snippet}
</SliderPrimitive.Root>
