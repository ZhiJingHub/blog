<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Slider } from '$lib/components/ui/slider';

	let {
		iconBgEnabled = $bindable(), iconBgColor = $bindable(), iconBgPadding = $bindable(),
		iconBgRadius = $bindable(), iconBgBlur = $bindable(), iconBgOpacity = $bindable()
	}: {
		iconBgEnabled: boolean; iconBgColor: string; iconBgPadding: number;
		iconBgRadius: number; iconBgBlur: number; iconBgOpacity: number;
	} = $props();
</script>

<Card>
	<CardHeader><CardTitle>图标背景</CardTitle></CardHeader>
	<CardContent class="space-y-4">
		<label class="flex cursor-pointer items-center justify-between">
			<span>启用图标背景</span>
			<Checkbox bind:checked={iconBgEnabled} />
		</label>
		{#if iconBgEnabled}
			<div class="space-y-4 border-t pt-4">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<Label>背景颜色</Label>
					<div class="flex items-center gap-2">
						<Input type="text" bind:value={iconBgColor} class="h-6 w-20 text-xs" />
						<input type="color" bind:value={iconBgColor} class="h-6 w-6 cursor-pointer rounded" />
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label>内边距: {iconBgPadding}px</Label>
						<Slider type="single" value={iconBgPadding} onValueChange={(v: number) => (iconBgPadding = v)} min={0} max={100} />
					</div>
					<div class="space-y-2">
						<Label>圆角: {iconBgRadius}%</Label>
						<Slider type="single" value={iconBgRadius} onValueChange={(v: number) => (iconBgRadius = v)} min={0} max={50} />
					</div>
					<div class="space-y-2">
						<Label>模糊: {iconBgBlur}px</Label>
						<Slider type="single" value={iconBgBlur} onValueChange={(v: number) => (iconBgBlur = v)} min={0} max={20} />
					</div>
					<div class="space-y-2">
						<Label>不透明度: {Math.round(iconBgOpacity * 100)}%</Label>
						<Slider type="single" value={iconBgOpacity} onValueChange={(v: number) => (iconBgOpacity = v)} min={0} max={1} step={0.01} />
					</div>
				</div>
			</div>
		{/if}
	</CardContent>
</Card>
