<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import Icon from '@iconify/svelte';

	let {
		showIcon = $bindable(),
		localIcon = $bindable(),
		searchQuery = $bindable(),
		searchResults = $bindable(),
		iconName = $bindable(),
		onLocalIconUpload,
		onSearchInput,
		onSelectIcon
	}: {
		showIcon: boolean;
		localIcon: string | null;
		searchQuery: string;
		searchResults: string[];
		iconName: string;
		onLocalIconUpload: (e: Event) => void;
		onSearchInput: (e: Event) => void;
		onSelectIcon: (icon: string) => void;
	} = $props();
</script>

<Card>
	<CardHeader>
		<CardTitle class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<span>图标设置</span>
			<label class="flex cursor-pointer items-center gap-2">
				<Checkbox bind:checked={showIcon} />
				<span class="text-sm font-normal">显示图标</span>
			</label>
		</CardTitle>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="grid grid-cols-2 gap-2">
			<div>
				<input type="file" accept="image/*" onchange={onLocalIconUpload} class="hidden" id="icon-upload" />
				<Label for="icon-upload" class="flex h-10 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed hover:border-primary">
					<Icon icon="mdi:image" class="mr-2 h-4 w-4" />
					<span class="text-xs">{localIcon ? '更换图片' : '上传图标'}</span>
				</Label>
			</div>
			<Input value={searchQuery} oninput={onSearchInput} placeholder="搜索图标..." class="h-10" />
		</div>
		{#if searchResults.length > 0}
			<div class="max-h-48 overflow-y-auto rounded-lg border p-2">
				<div class="grid gap-2" style="grid-template-columns: repeat(auto-fit, minmax(48px, 1fr));">
					{#each searchResults as icon}
						<button onclick={() => onSelectIcon(icon)} class="flex aspect-square items-center justify-center rounded-md border p-1.5 transition-colors hover:bg-accent {icon === iconName ? 'border-primary bg-primary/10' : 'border-input'}" title={icon}>
							<img src={`https://api.iconify.design/${icon.split(':')[0]}/${icon.split(':')[1]}.svg`} class="h-full w-full" alt={icon} />
						</button>
					{/each}
				</div>
			</div>
		{/if}
		<div class="text-xs text-muted-foreground">当前: {iconName}</div>
	</CardContent>
</Card>
