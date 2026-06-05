<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants';

	export const badgeVariants = tv({
		base: 'h-5 gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all [&>svg]:size-3! focus-visible:border-ring focus-visible:ring-ring/50 inline-flex w-fit shrink-0 items-center justify-center overflow-hidden whitespace-nowrap transition-colors focus-visible:ring-[3px] [&>svg]:pointer-events-none',
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground',
				secondary: 'bg-secondary text-secondary-foreground',
				destructive: 'bg-destructive/10 text-destructive',
				outline: 'border-border text-foreground bg-input/30'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
</script>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils';

	type Props = WithElementRef<HTMLAttributes<HTMLElement>> & {
		href?: string;
		variant?: BadgeVariant;
	};

	let {
		ref = $bindable(null),
		href,
		variant = 'default',
		class: className,
		children,
		...restProps
	}: Props = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		{href}
		data-slot="badge"
		class={cn(badgeVariants({ variant }), className)}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<span
		bind:this={ref}
		data-slot="badge"
		class={cn(badgeVariants({ variant }), className)}
		{...restProps}
	>
		{@render children?.()}
	</span>
{/if}
