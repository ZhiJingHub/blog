<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Slider } from '$lib/components/ui/slider';

	let {
		fontSize = $bindable(), iconSize = $bindable(), iconRadius = $bindable(),
		gap = $bindable(), linkScale = $bindable(),
		onFontSizeChange, onIconSizeChange
	}: {
		fontSize: number; iconSize: number; iconRadius: number; gap: number; linkScale: boolean;
		onFontSizeChange: (value: number) => void; onIconSizeChange: (value: number) => void;
	} = $props();
</script>

<Card>
	<CardHeader>
		<CardTitle class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<span>尺寸设置</span>
			<label class="flex cursor-pointer items-center gap-2">
				<Checkbox bind:checked={linkScale} />
				<span class="text-sm font-normal">等比缩放</span>
			</label>
		</CardTitle>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="space-y-2">
			<Label>字体大小: {fontSize}px</Label>
			<Slider type="single" value={fontSize} onValueChange={(v: number) => onFontSizeChange(v)} min={20} max={700} />
		</div>
		<div class="space-y-2">
			<Label>图标大小: {iconSize}px</Label>
			<Slider type="single" value={iconSize} onValueChange={(v: number) => onIconSizeChange(v)} min={20} max={700} />
		</div>
		<div class="space-y-2">
			<Label>图标圆角: {iconRadius}%</Label>
			<Slider type="single" value={iconRadius} onValueChange={(v: number) => (iconRadius = v)} min={0} max={50} />
		</div>
		<div class="space-y-2">
			<Label>间距: {gap}px</Label>
			<Slider type="single" value={gap} onValueChange={(v: number) => (gap = v)} min={0} max={200} />
		</div>
	</CardContent>
</Card>
