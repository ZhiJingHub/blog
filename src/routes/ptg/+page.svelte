<script lang="ts">


	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { Switch } from '$lib/components/ui/switch';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import Icon from '@iconify/svelte';
	import { siteConfig } from '$lib/config/site';
	import {
		type ToolMode, type UploadKind, type LoadedImage, type ModeResult,
		DEFAULT_SOURCE_BRIGHTNESS, DEFAULT_SOURCE_CONTRAST,
		DEFAULT_HIDDEN_BRIGHTNESS, DEFAULT_HIDDEN_CONTRAST,
		DEFAULT_SHADOWS, initialResults, modeMetaMap
	} from './_types';
	import { loadImage, revokeFileUrl, revokeAllFileUrls } from './_image-utils';
	import { generatePrism } from './_prism';
	import { generateShadow } from './_shadow';

	let mode = $state<ToolMode>('prism');
	let sourceImage = $state<LoadedImage | null>(null);
	let hiddenImage = $state<LoadedImage | null>(null);
	let outputCanvas: HTMLCanvasElement | undefined = $state();
	let sourceBrightness = $state(DEFAULT_SOURCE_BRIGHTNESS);
	let sourceContrast = $state(DEFAULT_SOURCE_CONTRAST);
	let hiddenBrightness = $state(DEFAULT_HIDDEN_BRIGHTNESS);
	let hiddenContrast = $state(DEFAULT_HIDDEN_CONTRAST);
	let isGenerating = $state(false);
	let shadowIsColored = $state(DEFAULT_SHADOWS.isColored);
	let shadowInnerScale = $state(DEFAULT_SHADOWS.scaleInner);
	let shadowCoverScale = $state(DEFAULT_SHADOWS.scaleCover);
	let shadowInnerDesat = $state(DEFAULT_SHADOWS.desatInner);
	let shadowCoverDesat = $state(DEFAULT_SHADOWS.desatCover);
	let shadowInnerWeight = $state(DEFAULT_SHADOWS.weightInner);
	let shadowMaxSize = $state(DEFAULT_SHADOWS.maxSize);
	let results = $state<Record<ToolMode, ModeResult>>(structuredClone(initialResults));

	let currentMeta = $derived(modeMetaMap[mode]);
	let currentResult = $derived(results[mode]);

	function updateModeResult(key: ToolMode, patch: Partial<ModeResult>) {
		results = { ...results, [key]: { ...results[key], ...patch } };
	}
	function resetModeResult(key: ToolMode) {
		updateModeResult(key, { ...initialResults[key] });
	}
	function setModeError(key: ToolMode, msg: string, status: string) {
		updateModeResult(key, { errorMessage: msg, statusMessage: status });
	}
	function clearModeError(key: ToolMode) {
		updateModeResult(key, { errorMessage: '' });
	}
	function getInputActionText(kind: UploadKind) {
		const img = kind === 'source' ? sourceImage : hiddenImage;
		const label = kind === 'source' ? currentMeta.sourceLabel : currentMeta.hiddenLabel;
		return img ? `更换${label}` : kind === 'source' ? currentMeta.sourceCta : currentMeta.hiddenCta;
	}
	function getInputHint(kind: UploadKind) {
		return kind === 'source' ? currentMeta.sourceHint : currentMeta.hiddenHint;
	}

	async function handleFileChange(event: Event, kind: UploadKind) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		resetModeResult(mode);
		if (!file.type.startsWith('image/')) {
			setModeError(mode, '仅支持上传图片文件。', '未满足生成条件。');
			input.value = '';
			return;
		}
		try {
			const loaded = await loadImage(file);
			if (kind === 'source') {
				revokeFileUrl(sourceImage?.url);
				sourceImage = loaded;
			} else {
				revokeFileUrl(hiddenImage?.url);
				hiddenImage = loaded;
			}
			updateModeResult(mode, {
				errorMessage: '',
				statusMessage: sourceImage && hiddenImage ? '图片已更新，可点击生成。' : '图片已加载，请继续上传另一张图片。'
			});
		} catch (e) {
			setModeError(mode, e instanceof Error ? e.message : '图片读取失败。', '图片加载失败。');
		}
	}

	function resetPrismControls() {
		sourceBrightness = DEFAULT_SOURCE_BRIGHTNESS;
		sourceContrast = DEFAULT_SOURCE_CONTRAST;
		hiddenBrightness = DEFAULT_HIDDEN_BRIGHTNESS;
		hiddenContrast = DEFAULT_HIDDEN_CONTRAST;
		resetModeResult('prism');
		updateModeResult('prism', { statusMessage: '参数已重置为默认值，可重新生成。' });
	}
	function resetShadowControls() {
		shadowIsColored = DEFAULT_SHADOWS.isColored;
		shadowInnerScale = DEFAULT_SHADOWS.scaleInner;
		shadowCoverScale = DEFAULT_SHADOWS.scaleCover;
		shadowInnerDesat = DEFAULT_SHADOWS.desatInner;
		shadowCoverDesat = DEFAULT_SHADOWS.desatCover;
		shadowInnerWeight = DEFAULT_SHADOWS.weightInner;
		shadowMaxSize = DEFAULT_SHADOWS.maxSize;
		resetModeResult('shadow');
		updateModeResult('shadow', { statusMessage: '参数已重置为默认值，可重新生成。' });
	}
	function downloadResult() {
		if (!currentResult.url || !sourceImage || !hiddenImage) return;
		const a = document.createElement('a');
		a.href = currentResult.url;
		a.download = mode === 'prism' ? 'prism-tank.png' : 'shadow-tank.png';
		a.click();
	}

	function generateImage() {
		if (!sourceImage || !hiddenImage || !outputCanvas) {
			setModeError(mode, '请先上传两张图片。', '未满足生成条件。');
			return;
		}
		isGenerating = true;
		clearModeError(mode);
		const oldUrl = results[mode].url;
		resetModeResult(mode);
		if (oldUrl?.startsWith('blob:')) URL.revokeObjectURL(oldUrl);

		const currentMode = mode;
		const promise =
			currentMode === 'prism'
				? generatePrism(outputCanvas, {
						sourceImage, hiddenImage,
						brightness: sourceBrightness, contrast: sourceContrast,
						hiddenBrightness, hiddenContrast
					})
				: generateShadow(outputCanvas, {
						sourceImage, hiddenImage,
						isColored: shadowIsColored,
						innerScale: shadowInnerScale, coverScale: shadowCoverScale,
						innerDesat: shadowInnerDesat, coverDesat: shadowCoverDesat,
						innerWeight: shadowInnerWeight, maxSize: shadowMaxSize
					});

		promise
			.then((result) => {
				if (currentMode !== mode) { URL.revokeObjectURL(result.url); return; }
				updateModeResult(currentMode, { ...result, errorMessage: '', statusMessage: '生成完成。' });
			})
			.catch((e) => {
				setModeError(currentMode, e instanceof Error ? e.message : '生成失败。', '生成失败。');
			})
			.finally(() => {
				isGenerating = false;
			});
	}

	$effect(() => {
		return () => {
			revokeFileUrl(sourceImage?.url);
			revokeFileUrl(hiddenImage?.url);
			for (const key of ['prism', 'shadow'] as const) {
				const url = results[key]?.url;
				if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
			}
			revokeAllFileUrls();
		};
	});
</script>

<svelte:head>
	<title>隐藏图 - {siteConfig.title}</title>
	<meta name="description" content="本地生成支持白底/黑底显隐效果的 PNG" />
	<meta property="og:title" content="隐藏图 - {siteConfig.title}" />
	<meta property="og:description" content="本地生成支持白底/黑底显隐效果的 PNG" />
</svelte:head>

<canvas bind:this={outputCanvas} class="hidden"></canvas>

<div class="min-h-screen bg-background">
	<div class="container mx-auto max-w-7xl px-4 pt-6 pb-12 sm:pt-8">
		<div class="mb-6">
			<a href="/" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
				<Icon icon="mdi:chevron-left" class="size-4" />
				返回首页
			</a>
		</div>

		<div class="ptg-layout">
			<!-- 左列：标题 + 结果预览 -->
			<div class="ptg-left">
				<div>
					<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">隐藏图制作</h1>
					<p class="mt-2 text-sm text-muted-foreground">支持光棱坦克与幻影坦克两种模式，浏览器本地处理，不上传服务端</p>
				</div>

				<div class="rounded-xl border bg-muted/20 p-4">
					<Tabs value={mode} onValueChange={(v: string) => (mode = v as ToolMode)}>
						<TabsList>
							<TabsTrigger value="prism">{modeMetaMap.prism.name}</TabsTrigger>
							<TabsTrigger value="shadow">{modeMetaMap.shadow.name}</TabsTrigger>
						</TabsList>
					</Tabs>
					<p class="mt-3 text-sm text-muted-foreground">{currentMeta.description}</p>
				</div>

				{#if currentResult.errorMessage}
					<Alert variant="destructive"><AlertDescription>{currentResult.errorMessage}</AlertDescription></Alert>
				{/if}

				{#if currentResult.url}
					<div class="overflow-hidden rounded-xl border bg-muted/30">
						<div class="p-4">
							<img src={currentResult.url} alt="生成结果" class="w-full rounded-md" />
						</div>
						<div class="flex items-center justify-between border-t bg-background/80 px-4 py-3 backdrop-blur">
							<p class="text-xs text-muted-foreground">{currentResult.width} × {currentResult.height}</p>
							<Button variant="outline" size="sm" onclick={downloadResult}>
								<Icon icon="mdi:download" class="mr-1.5 h-4 w-4" />下载 PNG
							</Button>
						</div>
					</div>
				{:else}
					<div class="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-8 text-center">
						<Icon icon="mdi:image-search-outline" class="mb-3 size-10 text-muted-foreground/40" />
						<p class="text-sm text-muted-foreground">{currentMeta.emptyResultHint}</p>
					</div>
				{/if}

				{#if currentResult.statusMessage && !currentResult.errorMessage}
					<p class="text-center text-sm text-muted-foreground">{currentResult.statusMessage}</p>
				{/if}
			</div>

			<!-- 右列：上传 + 参数 + 生成按钮 -->
			<div class="ptg-right">
				<Card>
					<CardHeader><CardTitle class="text-lg">上传图片</CardTitle></CardHeader>
					<CardContent>
						<div class="grid gap-4 md:grid-cols-2">
							{#each ['source', 'hidden'] as kind}
								{@const k = kind as UploadKind}
								{@const image = k === 'source' ? sourceImage : hiddenImage}
								{@const label = k === 'source' ? currentMeta.sourceLabel : currentMeta.hiddenLabel}
								<div class="space-y-3">
									<Label for="ptg-{k}-upload" class="font-medium">{label}</Label>
									<input id="ptg-{k}-upload" type="file" accept="image/*" class="hidden" onchange={(e) => handleFileChange(e, k)} />
									{#if image}
										<div class="group relative overflow-hidden rounded-xl border bg-muted/30">
											<img src={image.url} alt="{label}预览" class="max-h-52 w-full object-contain p-2" />
											<div class="flex items-center justify-between border-t bg-background/80 px-3 py-2 backdrop-blur">
												<div class="min-w-0">
													<p class="truncate text-xs font-medium">{image.name}</p>
													<p class="text-xs text-muted-foreground">{image.width} × {image.height}</p>
												</div>
												<Label for="ptg-{k}-upload" class="ml-2 shrink-0 cursor-pointer text-xs text-primary hover:underline">更换</Label>
											</div>
										</div>
									{:else}
										<Label for="ptg-{k}-upload" class="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 px-4 py-5 text-center transition-colors hover:border-primary hover:bg-muted/50">
											<Icon icon="mdi:image-plus" class="mb-2 size-8 text-muted-foreground/60" />
											<span class="mb-1 text-sm font-medium">{getInputActionText(k)}</span>
											<span class="text-xs leading-relaxed text-muted-foreground">{getInputHint(k)}</span>
										</Label>
									{/if}
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div class="flex items-center justify-between gap-3">
							<CardTitle class="text-lg">参数调节</CardTitle>
							<Button variant="ghost" size="sm" onclick={mode === 'prism' ? resetPrismControls : resetShadowControls}>
								<Icon icon="mdi:restart" class="mr-1 h-4 w-4" />重置
							</Button>
						</div>
					</CardHeader>
					<CardContent class="space-y-5">
						{#if mode === 'prism'}
							<div class="grid gap-5 md:grid-cols-2">
								<div class="space-y-4 rounded-xl border bg-muted/20 p-4">
									<h3 class="flex items-center gap-2 text-sm font-semibold">
										<Icon icon="mdi:image" class="h-4 w-4 text-muted-foreground" />原图参数
									</h3>
									<div class="space-y-2">
										<div class="flex items-center justify-between text-sm"><span class="text-muted-foreground">亮度提高</span><span class="font-mono text-foreground">{sourceBrightness}%</span></div>
										<Slider type="single" value={sourceBrightness} onValueChange={(v: number) => (sourceBrightness = v)} min={0} max={200} step={1} />
									</div>
									<div class="space-y-2">
										<div class="flex items-center justify-between text-sm"><span class="text-muted-foreground">对比度</span><span class="font-mono text-foreground">{sourceContrast}%</span></div>
										<Slider type="single" value={sourceContrast} onValueChange={(v: number) => (sourceContrast = v)} min={10} max={300} step={1} />
									</div>
								</div>
								<div class="space-y-4 rounded-xl border bg-muted/20 p-4">
									<h3 class="flex items-center gap-2 text-sm font-semibold">
										<Icon icon="mdi:image-outline" class="h-4 w-4 text-muted-foreground" />隐藏图参数
									</h3>
									<div class="space-y-2">
										<div class="flex items-center justify-between text-sm"><span class="text-muted-foreground">亮度降低</span><span class="font-mono text-foreground">{hiddenBrightness}%</span></div>
										<Slider type="single" value={hiddenBrightness} onValueChange={(v: number) => (hiddenBrightness = v)} min={0} max={100} step={1} />
									</div>
									<div class="space-y-2">
										<div class="flex items-center justify-between text-sm"><span class="text-muted-foreground">对比度</span><span class="font-mono text-foreground">{hiddenContrast}%</span></div>
										<Slider type="single" value={hiddenContrast} onValueChange={(v: number) => (hiddenContrast = v)} min={10} max={300} step={1} />
									</div>
								</div>
							</div>
						{:else}
							<div class="grid gap-5 md:grid-cols-2">
								<div class="space-y-4 rounded-xl border bg-muted/20 p-4">
									<div class="flex items-center justify-between gap-3">
										<h3 class="flex items-center gap-2 text-sm font-semibold">
											<Icon icon="mdi:format-color-fill" class="h-4 w-4 text-muted-foreground" />黑底图
										</h3>
										<div class="flex items-center gap-2">
											<Label for="shadow-colored" class="text-xs text-muted-foreground">全彩</Label>
											<Switch id="shadow-colored" bind:checked={shadowIsColored} />
										</div>
									</div>
									<div class="space-y-2">
										<div class="flex items-center justify-between text-sm"><span class="text-muted-foreground">缩放</span><span class="font-mono text-foreground">{shadowInnerScale.toFixed(2)}</span></div>
										<Slider type="single" value={shadowInnerScale} onValueChange={(v: number) => (shadowInnerScale = v)} min={0} max={1} step={0.02} />
									</div>
									<div class="space-y-2">
										<div class="flex items-center justify-between text-sm"><span class="text-muted-foreground">去色</span><span class="font-mono text-foreground">{shadowInnerDesat.toFixed(2)}</span></div>
										<Slider type="single" value={shadowInnerDesat} onValueChange={(v: number) => (shadowInnerDesat = v)} min={0} max={1} step={0.02} />
									</div>
									<div class="space-y-2">
										<div class="flex items-center justify-between text-sm"><span class="text-muted-foreground">混合权重</span><span class="font-mono text-foreground">{shadowInnerWeight.toFixed(2)}</span></div>
										<Slider type="single" value={shadowInnerWeight} onValueChange={(v: number) => (shadowInnerWeight = v)} min={0} max={1} step={0.02} />
									</div>
								</div>
								<div class="space-y-4 rounded-xl border bg-muted/20 p-4">
									<h3 class="flex items-center gap-2 text-sm font-semibold">
										<Icon icon="mdi:format-color-highlight" class="h-4 w-4 text-muted-foreground" />白底图
									</h3>
									<div class="space-y-2">
										<div class="flex items-center justify-between text-sm"><span class="text-muted-foreground">缩放</span><span class="font-mono text-foreground">{shadowCoverScale.toFixed(2)}</span></div>
										<Slider type="single" value={shadowCoverScale} onValueChange={(v: number) => (shadowCoverScale = v)} min={0} max={1} step={0.02} />
									</div>
									<div class="space-y-2">
										<div class="flex items-center justify-between text-sm"><span class="text-muted-foreground">去色</span><span class="font-mono text-foreground">{shadowCoverDesat.toFixed(2)}</span></div>
										<Slider type="single" value={shadowCoverDesat} onValueChange={(v: number) => (shadowCoverDesat = v)} min={0} max={1} step={0.02} />
									</div>
									<div class="space-y-2">
										<div class="flex items-center justify-between text-sm"><span class="text-muted-foreground">最大尺寸</span><span class="font-mono text-foreground">{shadowMaxSize}px</span></div>
										<Slider type="single" value={shadowMaxSize} onValueChange={(v: number) => (shadowMaxSize = v)} min={0} max={4000} step={1} />
									</div>
								</div>
							</div>
						{/if}
						<Button class="w-full" size="lg" onclick={generateImage} disabled={isGenerating || !sourceImage || !hiddenImage}>
							<Icon icon={isGenerating ? 'mdi:loading' : 'mdi:image-auto-adjust'} class="mr-2 h-5 w-5 {isGenerating ? 'animate-spin' : ''}" />
							{isGenerating ? '生成中...' : '生成图像'}
						</Button>
						{#if !sourceImage || !hiddenImage}
							<p class="text-center text-xs text-muted-foreground">请先上传两张图片</p>
						{/if}
					</CardContent>
				</Card>
				<div class="scroll-indicator"></div>
			</div>
		</div>
	</div>
</div>

<style>
	.ptg-layout {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.ptg-left {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		min-width: 0;
	}
	.ptg-right {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		min-width: 0;
		position: relative;
	}
	.scroll-indicator { display: none; }

	@media (min-width: 1024px) {
		.ptg-layout {
			display: grid;
			grid-template-columns: 1fr 420px;
			grid-template-rows: auto 1fr;
			gap: 1.5rem;
			align-items: start;
		}
		.ptg-left {
			grid-column: 1;
			grid-row: 1 / -1;
			position: sticky;
			top: 1.5rem;
		}
		.ptg-right {
			grid-column: 2;
			grid-row: 1 / -1;
			max-height: calc(100vh - 3rem);
			overflow-y: auto;
			scrollbar-width: thin;
			scrollbar-color: var(--muted-foreground) transparent;
			scrollbar-gutter: stable;
		}
		.ptg-right::-webkit-scrollbar { width: 6px; }
		.ptg-right::-webkit-scrollbar-track { background: transparent; }
		.ptg-right::-webkit-scrollbar-thumb { background-color: var(--muted-foreground); border-radius: 3px; min-height: 30px; }
		.scroll-indicator {
			display: block;
			position: sticky;
			bottom: 0;
			left: 0;
			right: 0;
			height: 2rem;
			background: linear-gradient(to top, var(--background), transparent);
			pointer-events: none;
			flex-shrink: 0;
			margin-top: -2rem;
			z-index: 1;
		}
	}

	@media (min-width: 1280px) {
		.ptg-layout {
			grid-template-columns: 1fr 480px;
		}
	}

	.ptg-right :global([data-slot='card']) {
		border: 1px solid var(--border) !important;
		outline: none !important;
		box-shadow: none !important;
	}
	.ptg-right :global([data-slot='tabs-content']) {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding-top: 0.75rem;
	}
	.ptg-right :global([data-slot='tabs-list']) {
		flex-wrap: nowrap;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		width: 100%;
	}
	.ptg-right :global([data-slot='tabs-list']::-webkit-scrollbar) { display: none; }
</style>
