<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { siteConfig } from '$lib/config/site';
	import Icon from '@iconify/svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
</script>

<svelte:head>
	<title>{siteConfig.title}</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
	<div class="fixed top-4 right-4 z-50">
		<ThemeToggle />
	</div>

	<img
		src={siteConfig.bio.avatar}
		alt="{siteConfig.bio.name}的头像"
		class="h-32 w-32 rounded-full"
	/>

	<div class="text-center">
		<h1 class="mb-2 text-4xl font-bold">{siteConfig.bio.name}</h1>
		<p class="mb-2 text-lg text-muted-foreground">{siteConfig.bio.bio}</p>
		<p class="text-sm text-muted-foreground">{siteConfig.subtitle}</p>
	</div>

	<!-- 社交链接 -->
	<div class="w-full max-w-2xl mx-auto">
		<Card class="relative overflow-hidden">
			<CardHeader class="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
				<CardTitle class="text-center text-5xl font-black tracking-widest text-foreground/[0.04] dark:text-foreground/[0.06] select-none">社交</CardTitle>
			</CardHeader>
			<CardContent class="relative z-10">
				<div class="flex flex-wrap gap-3 justify-center">
					{#each siteConfig.bio.links as link}
						{@const isLocalImage = link.icon.startsWith('/')}
						<a href={link.url} target="_blank" rel="noopener noreferrer">
							<Button variant="outline" class="flex items-center gap-2">
								{#if isLocalImage}
									<img src={link.icon} alt={link.name} class="h-5 w-5" />
								{:else}
									<Icon
										icon={link.icon}
										class="h-5 w-5"
										style={link.color ? `color: ${link.color}` : ''}
									/>
								{/if}
								<span class="text-sm font-medium">{link.name}</span>
							</Button>
						</a>
					{/each}
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- 导航按钮 -->
	<div class="w-full max-w-2xl mx-auto">
		<Card class="relative overflow-hidden">
			<CardHeader class="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
				<CardTitle class="text-center text-5xl font-black tracking-widest text-foreground/[0.04] dark:text-foreground/[0.06] select-none">导航</CardTitle>
			</CardHeader>
			<CardContent class="relative z-10">
				<div class="flex flex-wrap gap-3 justify-center">
					{#each siteConfig.navLinks as link}
						{@const isExternal = link.href.startsWith('http')}
						<a href={link.href} {...isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {}}>
							<Button variant="outline" class="flex items-center gap-2">
								<Icon icon={link.icon} class="h-5 w-5" />
								{link.label}
								{#if isExternal}
									<Icon icon="mdi:open-in-new" class="h-3.5 w-3.5 opacity-50" />
								{/if}
							</Button>
						</a>
					{/each}
				</div>
			</CardContent>
		</Card>
	</div>
</div>
