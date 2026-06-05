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
	}: PaginationPrimitive.NextButtonProps = $props();
</script>

<PaginationPrimitive.NextButton
	bind:ref
	aria-label="Go to next page"
	class={cn(buttonVariants({ variant: 'ghost' }), className)}
	{...restProps}
>
	{#if children}
		{@render children?.()}
	{:else}
		<span class="sr-only">Next</span>
		<Icon icon="mdi:arrow-right" class="size-4" />
	{/if}
</PaginationPrimitive.NextButton>
