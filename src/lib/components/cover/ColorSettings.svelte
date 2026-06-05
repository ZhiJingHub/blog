<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Slider } from '$lib/components/ui/slider';

	let {
		color = $bindable(), iconColor = $bindable(), bgColor = $bindable(),
		bgColorOpacity = $bindable(), linkColor = $bindable(), useOriginalIconColor = $bindable(),
		onColorChange
	}: {
		color: string; iconColor: string; bgColor: string; bgColorOpacity: number;
		linkColor: boolean; useOriginalIconColor: boolean;
		onColorChange: (newColor: string, type: 'text' | 'icon') => void;
	} = $props();
</script>

<Card>
	<CardHeader>
		<CardTitle class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<span>颜色设置</span>
			<div class="flex gap-2">
				<label class="flex cursor-pointer items-center gap-2"><Checkbox bind:checked={linkColor} /><span class="text-sm font-normal">颜色同步</span></label>
				<label class="flex cursor-pointer items-center gap-2"><Checkbox bind:checked={useOriginalIconColor} /><span class="text-sm font-normal">原色图标</span></label>
			</div>
		</CardTitle>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<Label>文字颜色</Label>
			<div class="flex items-center gap-2">
				<Input type="text" value={color} oninput={(e) => onColorChange(e.currentTarget.value, 'text')} class="h-8 w-24 text-xs" />
				<input type="color" value={color} oninput={(e) => onColorChange(e.currentTarget.value, 'text')} class="h-8 w-8 cursor-pointer rounded" />
			</div>
		</div>
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<Label>图标颜色</Label>
			<div class="flex items-center gap-2">
				<Input type="text" value={iconColor} disabled={useOriginalIconColor} oninput={(e) => onColorChange(e.currentTarget.value, 'icon')} class="h-8 w-24 text-xs" />
				<input type="color" value={iconColor} disabled={useOriginalIconColor} oninput={(e) => onColorChange(e.currentTarget.value, 'icon')} class="h-8 w-8 cursor-pointer rounded" />
			</div>
		</div>
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<Label>背景颜色</Label>
			<div class="flex items-center gap-2">
				<Input type="text" bind:value={bgColor} class="h-8 w-24 text-xs" />
				<input type="color" bind:value={bgColor} class="h-8 w-8 cursor-pointer rounded" />
			</div>
		</div>
		<div class="space-y-2">
			<Label>背景不透明度: {Math.round(bgColorOpacity * 100)}%</Label>
			<Slider type="single" value={bgColorOpacity} onValueChange={(v: number) => (bgColorOpacity = v)} min={0} max={1} step={0.01} />
		</div>
	</CardContent>
</Card>
