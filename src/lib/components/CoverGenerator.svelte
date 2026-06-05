<script lang="ts">
	import { onDestroy } from 'svelte';
	import CoverPreview from './cover/CoverPreview.svelte';
	import TextSettings from './cover/TextSettings.svelte';
	import IconSettings from './cover/IconSettings.svelte';
	import BackgroundSettings from './cover/BackgroundSettings.svelte';
	import SizeSettings from './cover/SizeSettings.svelte';
	import ColorSettings from './cover/ColorSettings.svelte';
	import IconBackgroundSettings from './cover/IconBackgroundSettings.svelte';
	import ShadowSettings from './cover/ShadowSettings.svelte';
	import ExportSettings from './cover/ExportSettings.svelte';
	import Root from '$lib/components/ui/tabs/tabs.svelte';
	import TabsList from '$lib/components/ui/tabs/tabs-list.svelte';
	import TabsTrigger from '$lib/components/ui/tabs/tabs-trigger.svelte';
	import TabsContent from '$lib/components/ui/tabs/tabs-content.svelte';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import { useIconSearch } from './cover/composables/useIconSearch.svelte';
	import { useBgInteraction } from './cover/composables/useBgInteraction.svelte';
	import { useFontManager } from './cover/composables/useFontManager.svelte';
	import { useExport } from './cover/composables/useExport.svelte';
	import { useIcon } from './cover/composables/useIcon.svelte';
	import { useText } from './cover/composables/useText.svelte';
	import { useColor } from './cover/composables/useColor.svelte';
	import { useShadow } from './cover/composables/useShadow.svelte';

	const iconSearch = useIconSearch();
	const bgInteraction = useBgInteraction();
	const fontManager = useFontManager();
	const icon = useIcon();
	const text = useText();
	const colorState = useColor();
	const shadow = useShadow();

	let iconBgEnabled = $state(false);
	let iconBgRadius = $state(20);
	let iconBgColor = $state('#000000');
	let iconBgOpacity = $state(0.2);
	let iconBgBlur = $state(0);
	let iconBgPadding = $state(10);

	let ratios = $state([
		{ label: '1:1', w: 1, h: 1, checked: false },
		{ label: '4:3', w: 4, h: 3, checked: false },
		{ label: '16:9', w: 16, h: 9, checked: true },
		{ label: '21:9', w: 21, h: 9, checked: false }
	]);

	let exportConfig = $state({
		format: 'png' as 'png' | 'svg',
		scales: [1] as number[],
		filename: 'cover',
		transparentBg: false,
		exportRatios: [] as string[]
	});

	let svgContainer: SVGSVGElement | undefined = $state();

	const BASE_HEIGHT = 600;
	let activeRatios = $derived(ratios.filter((r) => r.checked));
	let visualRatios = $derived(activeRatios.length > 0 ? activeRatios : [ratios[2]]);
	let maxWidthRatio = $derived(visualRatios.reduce((max, r) => (r.w / r.h > max ? r.w / r.h : max), 0));
	let canvasWidth = $derived(Math.round(BASE_HEIGHT * maxWidthRatio));
	let canvasHeight = $derived(BASE_HEIGHT);

	const exporter = useExport({
		getSvgContainer: () => svgContainer,
		getCanvasWidth: () => canvasWidth,
		getCanvasHeight: () => canvasHeight,
		getExportConfig: () => exportConfig,
		getActiveRatios: () => activeRatios,
		getBgImage: () => bgInteraction.bgImage,
		getLocalIcon: () => icon.localIcon,
		getCustomFontName: () => fontManager.customFontName,
		getFontDataBase64: () => fontManager.getFontDataBase64()
	});

	function handleColorChange(newColor: string, type: 'text' | 'icon') {
		if (type === 'text') {
			colorState.color = newColor;
			if (colorState.linkColor) icon.iconColor = newColor;
		} else {
			icon.iconColor = newColor;
			if (colorState.linkColor) colorState.color = newColor;
		}
	}

	function handleFontSizeChange(value: number) {
		const result = text.handleFontSizeChange(value, icon.iconSize);
		icon.iconSize = result.iconSize;
	}

	function handleIconSizeChange(value: number) {
		const result = text.handleIconSizeChange(value, text.fontSize);
		text.fontSize = result.fontSize;
		icon.iconSize = value;
	}

	onDestroy(() => {
		icon.dispose();
		bgInteraction.dispose();
		fontManager.dispose();
		iconSearch.dispose();
	});
</script>

<div class="cover-layout">
	<div class="cover-title-col">
		<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">封面制作</h1>
		<p class="mt-2 text-sm text-muted-foreground">在线封面图制作工具，支持自定义文本、图标、背景，导出 PNG / SVG 格式</p>
	</div>
	<div class="cover-preview-col">
		<CoverPreview
			bind:svgContainer
			{canvasWidth} {canvasHeight} {visualRatios}
			bgImage={bgInteraction.bgImage} bgImageX={bgInteraction.bgImageX} bgImageY={bgInteraction.bgImageY} bgImageScale={bgInteraction.bgImageScale}
			bgBlur={bgInteraction.bgBlur} bgOpacity={bgInteraction.bgOpacity}
			bgColor={colorState.bgColor} bgColorOpacity={colorState.bgColorOpacity}
			leftText={text.leftText} rightText={text.rightText} fontSize={text.fontSize} fontWeight={text.fontWeight}
			customFontName={fontManager.customFontName} color={colorState.color} textShadow={shadow.textShadow} gap={text.gap}
			showIcon={icon.showIcon} iconSvg={icon.iconSvg} localIcon={icon.localIcon} iconSize={icon.iconSize}
			iconBgPadding={iconBgPadding} iconBgEnabled={iconBgEnabled} iconBgColor={iconBgColor}
			iconBgOpacity={iconBgOpacity} iconBgBlur={iconBgBlur} iconBgRadius={iconBgRadius}
			useOriginalIconColor={icon.useOriginalIconColor} iconColor={icon.iconColor}
			iconShadow={shadow.iconShadow} iconRadius={icon.iconRadius}
			isDragging={bgInteraction.isDragging}
			onPointerDown={bgInteraction.handlePointerDown} onPointerMove={bgInteraction.handlePointerMove}
			onPointerUp={bgInteraction.handlePointerUp} onWheel={bgInteraction.handleWheel}
		/>
		<div class="rounded-xl border border-border bg-card p-4">
			<Button onclick={exporter.doExport} disabled={activeRatios.length === 0 || exporter.isExporting} class="w-full" size="lg">
				<Icon icon={exporter.isExporting ? 'mdi:loading' : 'mdi:download'} class="mr-2 h-5 w-5" />
				{exporter.isExporting ? '导出中...' : '导出图片'}
			</Button>
			{#if exporter.exportStatus}
				<p class="mt-3 text-center text-sm {exporter.exportStatus.type === 'error' ? 'text-red-500' : 'text-green-600'}">
					{exporter.exportStatus.message}
				</p>
			{/if}
		</div>
	</div>

	<div class="cover-settings-col">
		<Root value="text" class="w-full">
			<TabsList class="w-full">
				<TabsTrigger value="text"><Icon icon="mdi:format-text" class="mr-1 h-4 w-4" />文本</TabsTrigger>
				<TabsTrigger value="icon"><Icon icon="mdi:image-outline" class="mr-1 h-4 w-4" />图标</TabsTrigger>
				<TabsTrigger value="background"><Icon icon="mdi:image-area" class="mr-1 h-4 w-4" />背景</TabsTrigger>
				<TabsTrigger value="style"><Icon icon="mdi:palette-outline" class="mr-1 h-4 w-4" />样式</TabsTrigger>
				<TabsTrigger value="export"><Icon icon="mdi:cog-outline" class="mr-1 h-4 w-4" />导出</TabsTrigger>
			</TabsList>

			<TabsContent value="text">
				<TextSettings bind:leftText={text.leftText} bind:rightText={text.rightText} bind:fontWeight={text.fontWeight} customFontName={fontManager.customFontName} onFontUpload={fontManager.handleFontUpload} onSystemFontSelect={fontManager.handleSystemFontSelect} onRemoveFont={fontManager.removeFont} />
				<SizeSettings bind:fontSize={text.fontSize} bind:iconSize={icon.iconSize} bind:iconRadius={icon.iconRadius} bind:gap={text.gap} bind:linkScale={text.linkScale} onFontSizeChange={handleFontSizeChange} onIconSizeChange={handleIconSizeChange} />
			</TabsContent>

			<TabsContent value="icon">
				<IconSettings bind:showIcon={icon.showIcon} bind:localIcon={icon.localIcon} searchQuery={iconSearch.searchQuery} searchResults={iconSearch.searchResults} bind:iconName={icon.iconName} onLocalIconUpload={icon.handleLocalIconUpload} onSearchInput={iconSearch.onSearchInput} onSelectIcon={icon.selectIcon} />
				<IconBackgroundSettings bind:iconBgEnabled bind:iconBgColor bind:iconBgPadding bind:iconBgRadius bind:iconBgBlur bind:iconBgOpacity />
			</TabsContent>

			<TabsContent value="background">
				<BackgroundSettings bgImage={bgInteraction.bgImage} bgBlur={bgInteraction.bgBlur} bgOpacity={bgInteraction.bgOpacity} isBgDragOver={bgInteraction.isBgDragOver} onBgImageUpload={bgInteraction.handleBgImageUpload} onBgImageRemove={() => { bgInteraction.bgImage = null; bgInteraction.bgBlur = 0; bgInteraction.bgOpacity = 1; }} onBgBlurChange={(v) => { bgInteraction.bgBlur = v; }} onBgOpacityChange={(v) => { bgInteraction.bgOpacity = v; }} onBgDragOver={bgInteraction.handleBgDragOver} onBgDragLeave={bgInteraction.handleBgDragLeave} onBgDrop={bgInteraction.handleBgDrop} />
				<ColorSettings bind:color={colorState.color} bind:iconColor={icon.iconColor} bind:bgColor={colorState.bgColor} bind:bgColorOpacity={colorState.bgColorOpacity} bind:linkColor={colorState.linkColor} bind:useOriginalIconColor={icon.useOriginalIconColor} onColorChange={handleColorChange} />
			</TabsContent>

			<TabsContent value="style">
				<ShadowSettings bind:shadowTarget={shadow.shadowTarget} textShadow={shadow.textShadow} iconShadow={shadow.iconShadow} onUpdateShadow={shadow.updateShadow} />
			</TabsContent>

			<TabsContent value="export">
				<ExportSettings bind:ratios bind:exportConfig {canvasWidth} {canvasHeight} {activeRatios} />
			</TabsContent>
		</Root>
		<div class="scroll-indicator"></div>
	</div>
</div>

<style>
	.cover-layout {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.cover-title-col {
		display: block;
	}
	.cover-preview-col {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		min-width: 0;
	}
	.cover-settings-col {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		min-width: 0;
		position: relative;
	}
	.scroll-indicator { display: none; }

	@media (min-width: 1024px) {
		.cover-layout {
			display: grid;
			grid-template-columns: 1fr 400px;
			grid-template-rows: auto 1fr;
			gap: 1.5rem;
			align-items: start;
		}
		.cover-title-col {
			grid-column: 1;
			grid-row: 1;
		}
		.cover-preview-col {
			grid-column: 1;
			grid-row: 2;
			position: sticky;
			top: 1.5rem;
		}
		.cover-settings-col {
			grid-column: 2;
			grid-row: 1 / -1;
			max-height: calc(100vh - 3rem);
			overflow-y: auto;
			scrollbar-width: thin;
			scrollbar-color: var(--muted-foreground) transparent;
			scrollbar-gutter: stable;
		}
		.cover-settings-col::-webkit-scrollbar { width: 6px; }
		.cover-settings-col::-webkit-scrollbar-track { background: transparent; }
		.cover-settings-col::-webkit-scrollbar-thumb { background-color: var(--muted-foreground); border-radius: 3px; min-height: 30px; }
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
		.cover-layout {
			grid-template-columns: 1fr 460px;
		}
	}

	.cover-settings-col :global([data-slot='tabs-content']) {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding-top: 0.75rem;
	}
	.cover-settings-col :global([data-slot='tabs-list']) {
		flex-wrap: nowrap;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		width: 100%;
	}
	.cover-settings-col :global([data-slot='tabs-list']::-webkit-scrollbar) { display: none; }
	.cover-settings-col :global([data-slot='card']) {
		border: 1px solid var(--border) !important;
		outline: none !important;
		box-shadow: none !important;
		padding: 0 !important;
		gap: 0 !important;
	}
	.cover-settings-col :global([data-slot='card-header']) { padding: 0.625rem 0.875rem 0.125rem !important; }
	.cover-settings-col :global([data-slot='card-content']) { padding: 0.5rem 0.875rem 0.875rem !important; }
	.cover-settings-col :global([data-slot='tabs-trigger']) {
		flex-shrink: 0;
		min-width: 0;
		font-size: 0.8125rem;
		gap: 0.25rem;
		padding: 0.375rem 0.625rem;
	}
</style>
