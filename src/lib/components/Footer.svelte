<script lang="ts">
	import { siteConfig } from '$lib/config/site';
	import Icon from '@iconify/svelte';
</script>

<footer class="mt-auto border-t border-border">
	<div class="container mx-auto max-w-4xl px-4 py-8">
		<div class="flex flex-col items-center gap-4">
			<div class="flex items-center gap-1">
				{#each siteConfig.bio.links as link}
					<a
						href={link.url}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={link.name}
						class="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					>
						<Icon
							icon={link.icon}
							class="h-5 w-5"
							style={link.color ? `color: ${link.color}` : ''}
						/>
					</a>
				{/each}
				<a
					href="/rss.xml"
					aria-label="RSS"
					class="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
				>
					<Icon icon="mdi:rss" class="h-5 w-5" />
				</a>
			</div>

			<p class="text-xs text-muted-foreground">
				&copy; {new Date().getFullYear()}
				{siteConfig.bio.name}
			</p>
		</div>
	</div>
</footer>
