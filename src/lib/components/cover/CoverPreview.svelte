<script lang="ts">
	import { hexToRgba } from '$lib/utils/color';

	type Ratio = { label: string; w: number; h: number; checked: boolean };

	let {
		svgContainer = $bindable(),
		canvasWidth,
		canvasHeight,
		visualRatios,
		bgImage,
		bgImageX,
		bgImageY,
		bgImageScale,
		bgBlur,
		bgOpacity,
		bgColor,
		bgColorOpacity,
		leftText,
		rightText,
		fontSize,
		fontWeight,
		customFontName,
		color,
		textShadow,
		gap,
		showIcon,
		iconSvg,
		localIcon,
		iconSize,
		iconBgPadding,
		iconBgEnabled,
		iconBgColor,
		iconBgOpacity,
		iconBgBlur,
		iconBgRadius,
		useOriginalIconColor,
		iconColor,
		iconShadow,
		iconRadius,
		isDragging,
		onPointerDown,
		onPointerMove,
		onPointerUp,
		onWheel
	}: {
		svgContainer: SVGSVGElement | undefined;
		canvasWidth: number;
		canvasHeight: number;
		visualRatios: Ratio[];
		bgImage: string | null;
		bgImageX: number;
		bgImageY: number;
		bgImageScale: number;
		bgBlur: number;
		bgOpacity: number;
		bgColor: string;
		bgColorOpacity: number;
		leftText: string;
		rightText: string;
		fontSize: number;
		fontWeight: number;
		customFontName: string;
		color: string;
		textShadow: { x: number; y: number; blur: number; color: string; alpha: number };
		gap: number;
		showIcon: boolean;
		iconSvg: string;
		localIcon: string | null;
		iconSize: number;
		iconBgPadding: number;
		iconBgEnabled: boolean;
		iconBgColor: string;
		iconBgOpacity: number;
		iconBgBlur: number;
		iconBgRadius: number;
		useOriginalIconColor: boolean;
		iconColor: string;
		iconShadow: { x: number; y: number; blur: number; color: string; alpha: number };
		iconRadius: number;
		isDragging: boolean;
		onPointerDown: (e: PointerEvent) => void;
		onPointerMove: (e: PointerEvent) => void;
		onPointerUp: (e: PointerEvent) => void;
		onWheel: (e: WheelEvent) => void;
	} = $props();

	const BASE_HEIGHT = 600;
</script>

<div
	class="preview-area touch-none select-none"
	role="img"
	aria-label="封面预览区域"
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerUp}
	onpointerleave={onPointerUp}
>
	<svg
		bind:this={svgContainer}
		viewBox="0 0 {canvasWidth} {canvasHeight}"
		xmlns="http://www.w3.org/2000/svg"
		class="preview-svg"
		style="cursor: {bgImage
			? isDragging
				? 'grabbing'
				: 'grab'
			: 'default'}; aspect-ratio: {canvasWidth}/{canvasHeight};"
		onwheel={onWheel}
	>
		<rect class="bg-fill" width="100%" height="100%" fill={hexToRgba(bgColor, bgColorOpacity)} />

		{#if bgImage}
			<image
				href={bgImage}
				x={bgImageX}
				y={bgImageY}
				width={canvasWidth}
				height={canvasHeight}
				transform="translate({canvasWidth / 2}, {canvasHeight /
					2}) scale({bgImageScale}) translate({-canvasWidth / 2}, {-canvasHeight / 2})"
				style="filter: blur({bgBlur}px); opacity: {bgOpacity};"
				preserveAspectRatio="xMidYMid meet"
			/>
		{/if}

		<foreignObject
			x="0"
			y="0"
			width={canvasWidth}
			height={canvasHeight}
			style="pointer-events: none;"
		>
			<div
				xmlns="http://www.w3.org/1999/xhtml"
				style="
					width: {canvasWidth}px;
					height: {canvasHeight}px;
					display: flex;
					align-items: center;
					justify-content: center;
					gap: {gap}px;
					font-family: {customFontName || 'sans-serif'};
					font-weight: {fontWeight};
				"
			>
				{#if !leftText && !rightText && !(showIcon && (iconSvg || localIcon))}
					<span style="font-size: 24px; color: rgba(128,128,128,0.5); user-select: none;">在右侧输入文字开始制作</span>
				{/if}

				<span
					style="
						font-size: {fontSize}px;
						color: {color};
						text-shadow: {textShadow.x}px {textShadow.y}px {textShadow.blur}px {hexToRgba(
						textShadow.color,
						textShadow.alpha
					)};
						line-height: 1;
						white-space: nowrap;
					">{leftText}</span
				>

				{#if showIcon && (iconSvg || localIcon)}
					<div
						style="
							width: {iconSize + iconBgPadding * 2}px;
							height: {iconSize + iconBgPadding * 2}px;
							display: flex;
							align-items: center;
							justify-content: center;
							background-color: {iconBgEnabled ? hexToRgba(iconBgColor, iconBgOpacity) : 'transparent'};
							backdrop-filter: {iconBgEnabled && iconBgBlur > 0 ? `blur(${iconBgBlur}px)` : 'none'};
							-webkit-backdrop-filter: {iconBgEnabled && iconBgBlur > 0 ? `blur(${iconBgBlur}px)` : 'none'};
							border-radius: {iconBgEnabled ? `${iconBgRadius}%` : '0'};
						"
					>
						<div
							style="
								max-width: {iconSize}px;
								max-height: {iconSize}px;
								flex-shrink: 0;
								color: {useOriginalIconColor ? 'inherit' : iconColor};
								filter: drop-shadow({iconShadow.x}px {iconShadow.y}px {iconShadow.blur}px {hexToRgba(
								iconShadow.color,
								iconShadow.alpha
							)});
								display: flex;
								align-items: center;
								justify-content: center;
								border-radius: {iconRadius}%;
								overflow: hidden;
							"
						>
							{#if localIcon}
								<img
									src={localIcon}
									style="width: 100%; height: 100%; object-fit: contain;"
									alt="Local Icon"
								/>
							{:else}
								<div class="icon-svg-box">
									{@html iconSvg}
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<span
					style="
						font-size: {fontSize}px;
						color: {color};
						text-shadow: {textShadow.x}px {textShadow.y}px {textShadow.blur}px {hexToRgba(
						textShadow.color,
						textShadow.alpha
					)};
						line-height: 1;
						white-space: nowrap;
					">{rightText}</span
				>
			</div>
		</foreignObject>

		<rect
			x="0.5"
			y="0.5"
			width={canvasWidth - 1}
			height={canvasHeight - 1}
			fill="none"
			stroke="rgba(128,128,128,0.4)"
			stroke-width="1"
			class="canvas-border"
		/>

		{#each visualRatios as ratio}
			{#if BASE_HEIGHT * (ratio.w / ratio.h) < canvasWidth}
				<g class="ratio-guide">
					<rect
						x={(canvasWidth - BASE_HEIGHT * (ratio.w / ratio.h)) / 2}
						y="0"
						width={BASE_HEIGHT * (ratio.w / ratio.h)}
						height={BASE_HEIGHT}
						fill="none"
						stroke="rgba(255, 255, 255, 0.3)"
						stroke-width="1"
						stroke-dasharray="6 4"
					/>
					<text
						x={(canvasWidth - BASE_HEIGHT * (ratio.w / ratio.h)) / 2 + 8}
						y="22"
						fill="rgba(255, 255, 255, 0.4)"
						font-size="14"
					>
						{ratio.label}
					</text>
				</g>
			{/if}
		{/each}
	</svg>
</div>

<style>
	.preview-area {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--muted);
		background-image: radial-gradient(circle, var(--border) 0.8px, transparent 0.8px);
		background-size: 20px 20px;
		border-radius: 0.75rem;
		padding: 1rem;
		overflow: hidden;
		border: 1px solid var(--border);
	}

	.preview-svg {
		width: 100%;
		max-height: 50vh;
		border-radius: 0.375rem;
		border: 1px solid var(--border);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	@media (min-width: 768px) {
		.preview-area {
			padding: 1.5rem;
		}

		.preview-svg {
			max-height: 60vh;
		}
	}

	.icon-svg-box {
		width: 100%;
		height: 100%;
	}
	.icon-svg-box :global(svg) {
		width: 100% !important;
		height: 100% !important;
		display: block;
	}
</style>
