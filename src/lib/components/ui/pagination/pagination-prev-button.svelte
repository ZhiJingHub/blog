<script lang="ts">
	import Icon from '@iconify/svelte';
	import { Pagination as PaginationPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { buttonVariants } from '$lib/components/ui/button';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: PaginationPrimitive.PrevButtonProps = $props();
</script>

<PaginationPrimitive.PrevButton
	bind:ref
	aria-label="Go to previous page"
	class={cn(buttonVariants({ variant: 'ghost' }), className)}
	{...restProps}
>
	{#if children}
		{@render children?.()}
	{:else}
		<Icon icon="mdi:arrow-left" class="size-4" />
		<span class="sr-only">Previous</span>
	{/if}
</PaginationPrimitive.PrevButton>
