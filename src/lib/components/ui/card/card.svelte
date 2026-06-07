<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="card"
	class={cn(
		'group/card flex flex-col gap-6 overflow-hidden rounded-2xl bg-card py-6 text-sm text-card-foreground ring-1 ring-foreground/10',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
