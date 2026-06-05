<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Button } from '$lib/components/ui/button';

	type Ratio = { label: string; w: number; h: number; checked: boolean };
	type ExportConfig = { format: 'png' | 'svg'; scales: number[]; filename: string; transparentBg: boolean; exportRatios: string[] };

	let {
		ratios = $bindable(), exportConfig = $bindable(),
		canvasWidth, canvasHeight, activeRatios
	}: {
		ratios: Ratio[]; exportConfig: ExportConfig;
		canvasWidth: number; canvasHeight: number; activeRatios: Ratio[];
	} = $props();
</script>

<Card>
	<CardHeader><CardTitle>导出</CardTitle></CardHeader>
	<CardContent class="space-y-4">
		<div class="space-y-2">
			<Label>画板比例</Label>
			<div class="grid grid-cols-2 gap-2">
				{#each ratios as ratio}
					<label class="flex cursor-pointer items-center gap-2 rounded-lg border p-2 hover:bg-accent">
						<Checkbox bind:checked={ratio.checked} />
						<span class="font-mono text-sm">{ratio.label}</span>
					</label>
				{/each}
			</div>
		</div>
		<div class="space-y-2">
			<Label>文件名</Label>
			<Input bind:value={exportConfig.filename} />
		</div>
		<div class="space-y-2">
			<Label>格式</Label>
			<div class="grid grid-cols-2 gap-2">
				<Button variant={exportConfig.format === 'png' ? 'default' : 'outline'} onclick={() => (exportConfig.format = 'png')}>PNG</Button>
				<Button variant={exportConfig.format === 'svg' ? 'default' : 'outline'} onclick={() => (exportConfig.format = 'svg')}>SVG</Button>
			</div>
		</div>
		{#if exportConfig.format === 'png'}
			<div class="space-y-2">
				<Label>缩放倍率</Label>
				<div class="grid grid-cols-4 gap-2">
					{#each [1, 2, 3, 4] as scale}
						<label class="flex cursor-pointer items-center justify-center gap-1 rounded-lg border p-2 text-sm hover:bg-accent">
							<Checkbox checked={exportConfig.scales.includes(scale)} onCheckedChange={(checked) => { if (checked) { exportConfig.scales = [...exportConfig.scales, scale].sort(); } else { exportConfig.scales = exportConfig.scales.filter((s) => s !== scale); } }} />
							<span class="font-mono">{scale}x</span>
						</label>
					{/each}
				</div>
				<p class="text-xs text-muted-foreground">{Math.round(canvasWidth)}x{Math.round(canvasHeight)} px</p>
			</div>
		{/if}
		<label class="flex cursor-pointer items-center justify-between rounded border p-2">
			<span class="text-sm">背景透明</span>
			<Checkbox bind:checked={exportConfig.transparentBg} />
		</label>
	</CardContent>
</Card>
