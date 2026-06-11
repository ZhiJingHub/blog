import type { WatermarkItem } from './_types';
import { getWatermarkPosition } from '$lib/utils/watermark-position';

/**
 * 应用文字样式（浮雕/阴影/渐变）
 */
function applyTextStyle(
	ctx: CanvasRenderingContext2D,
	item: WatermarkItem,
	text: string,
	font: string,
	x: number,
	y: number,
	textWidth: number,
	fontSize: number
): void {
	ctx.font = font;

	if (item.style === 'emboss') {
		// 浮雕效果：深色偏移 + 浅色偏移
		const d = item.embossDepth || 2;
		ctx.save();
		ctx.globalAlpha = item.opacity;
		// 暗面
		ctx.fillStyle = 'rgba(0,0,0,0.6)';
		ctx.fillText(text, x - d, y + fontSize / 2 - d);
		// 亮面
		ctx.fillStyle = 'rgba(255,255,255,0.8)';
		ctx.fillText(text, x + d, y + fontSize / 2 + d);
		// 主体
		ctx.fillStyle = item.color;
		ctx.fillText(text, x, y + fontSize / 2);
		ctx.restore();
	} else if (item.style === 'shadow') {
		// 阴影效果
		ctx.save();
		ctx.globalAlpha = item.opacity;
		ctx.shadowColor = 'rgba(0,0,0,0.5)';
		ctx.shadowBlur = item.shadowBlur || 4;
		ctx.shadowOffsetX = 2;
		ctx.shadowOffsetY = 2;
		ctx.fillStyle = item.color;
		ctx.fillText(text, x, y + fontSize / 2);
		ctx.restore();
	} else if (item.style === 'gradient') {
		// 渐变效果
		ctx.save();
		ctx.globalAlpha = item.opacity;
		const gradient = ctx.createLinearGradient(x, y, x + textWidth, y + fontSize);
		gradient.addColorStop(0, item.color);
		gradient.addColorStop(1, item.gradientEndColor || '#000000');
		ctx.fillStyle = gradient;
		ctx.fillText(text, x, y + fontSize / 2);
		ctx.restore();
	} else {
		// 默认样式
		ctx.save();
		ctx.globalAlpha = item.opacity;
		ctx.fillStyle = item.color;
		ctx.fillText(text, x, y + fontSize / 2);
		ctx.restore();
	}
}

/**
 * 绘制单个文字水印（带旋转）
 */
function drawSingleTextWatermark(
	ctx: CanvasRenderingContext2D,
	item: WatermarkItem,
	x: number,
	y: number
): void {
	const fontSize = item.fontSize || 24;
	const fontFamily = item.fontFamily || 'Arial, sans-serif';
	const font = `${fontSize}px ${fontFamily}`;
	ctx.font = font;

	const textMetrics = ctx.measureText(item.text);
	const textWidth = textMetrics.width;

	ctx.save();
	ctx.translate(x + textWidth / 2, y + fontSize / 2);
	ctx.rotate((item.rotation * Math.PI) / 180);
	applyTextStyle(ctx, item, item.text, font, -textWidth / 2, -fontSize / 2, textWidth, fontSize);
	ctx.restore();
}

/**
 * 绘制文字水印（支持多种位置模式）
 */
function drawTextWatermark(
	ctx: CanvasRenderingContext2D,
	item: WatermarkItem,
	canvasWidth: number,
	canvasHeight: number
): void {
	const fontSize = item.fontSize || 24;
	const fontFamily = item.fontFamily || 'Arial, sans-serif';
	const font = `${fontSize}px ${fontFamily}`;
	ctx.font = font;

	const textMetrics = ctx.measureText(item.text);
	const textWidth = textMetrics.width;
	const textHeight = fontSize;

	if (item.position === 'tile') {
		// 平铺模式
		const spacing = item.tileSpacing || 100;
		for (let y = -canvasHeight; y < canvasHeight * 2; y += spacing) {
			for (let x = -canvasWidth; x < canvasWidth * 2; x += spacing) {
				drawSingleTextWatermark(ctx, item, x, y);
			}
		}
	} else if (item.position === 'diagonal-tile') {
		// 对角线平铺模式
		const spacing = item.tileSpacing || 150;
		const diagonal = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);
		for (let y = -diagonal; y < diagonal * 2; y += spacing) {
			for (let x = -diagonal; x < diagonal * 2; x += spacing) {
				drawSingleTextWatermark(ctx, item, x, y);
			}
		}
	} else if (item.position === 'border') {
		// 边框模式：四边环绕
		const margin = 20;
		const gap = textWidth + 30;
		// 顶部
		for (let x = margin; x < canvasWidth - margin; x += gap) {
			drawSingleTextWatermark(ctx, item, x, margin);
		}
		// 底部
		for (let x = margin; x < canvasWidth - margin; x += gap) {
			drawSingleTextWatermark(ctx, item, x, canvasHeight - margin - textHeight);
		}
		// 左侧（垂直）
		for (let y = margin + gap; y < canvasHeight - margin - gap; y += gap) {
			ctx.save();
			ctx.translate(margin + fontSize / 2, y + textWidth / 2);
			ctx.rotate(-Math.PI / 2);
			applyTextStyle(ctx, item, item.text, font, -textWidth / 2, -fontSize / 2, textWidth, fontSize);
			ctx.restore();
		}
		// 右侧（垂直）
		for (let y = margin + gap; y < canvasHeight - margin - gap; y += gap) {
			ctx.save();
			ctx.translate(canvasWidth - margin - fontSize / 2, y + textWidth / 2);
			ctx.rotate(Math.PI / 2);
			applyTextStyle(ctx, item, item.text, font, -textWidth / 2, -fontSize / 2, textWidth, fontSize);
			ctx.restore();
		}
	} else if (item.position === 'band') {
		// 条带模式：半透明色条 + 居中文字
		const bandHeight = fontSize * 2.5;
		const bandY = (canvasHeight - bandHeight) / 2;
		ctx.save();
		ctx.globalAlpha = item.opacity * 0.6;
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, bandY, canvasWidth, bandHeight);
		ctx.restore();
		// 居中文字
		ctx.save();
		ctx.globalAlpha = item.opacity;
		ctx.font = `bold ${font}`;
		const tw = ctx.measureText(item.text).width;
		const tx = (canvasWidth - tw) / 2;
		const ty = bandY + (bandHeight - fontSize) / 2;
		applyTextStyle(ctx, item, item.text, `bold ${font}`, tx, ty, tw, fontSize);
		ctx.restore();
	} else {
		// 固定位置模式
		const pos = getWatermarkPosition(item.position, canvasWidth, canvasHeight, textWidth, textHeight);
		drawSingleTextWatermark(ctx, item, pos.x, pos.y);
	}
}

/**
 * 绘制单个图片水印
 */
function drawSingleImageWatermark(
	ctx: CanvasRenderingContext2D,
	watermarkImage: HTMLImageElement,
	item: WatermarkItem,
	x: number,
	y: number,
	width: number,
	height: number
): void {
	ctx.save();
	ctx.globalAlpha = item.opacity;
	ctx.drawImage(watermarkImage, x, y, width, height);
	ctx.restore();
}

/**
 * 绘制图片水印
 */
function drawImageWatermark(
	ctx: CanvasRenderingContext2D,
	watermarkImage: HTMLImageElement,
	item: WatermarkItem,
	canvasWidth: number,
	canvasHeight: number
): void {
	const size = item.imageSize || 100;
	const aspectRatio = watermarkImage.naturalWidth / watermarkImage.naturalHeight;
	const watermarkWidth = size;
	const watermarkHeight = size / aspectRatio;

	if (item.position === 'tile' || item.position === 'diagonal-tile') {
		// 平铺模式
		const spacing = item.tileSpacing || 100;
		const diagonal = item.position === 'diagonal-tile'
			? Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight)
			: Math.max(canvasWidth, canvasHeight);
		for (let y = -watermarkHeight; y < diagonal + watermarkHeight; y += watermarkHeight + spacing) {
			for (let x = -watermarkWidth; x < diagonal + watermarkWidth; x += watermarkWidth + spacing) {
				drawSingleImageWatermark(ctx, watermarkImage, item, x, y, watermarkWidth, watermarkHeight);
			}
		}
	} else {
		const pos = getWatermarkPosition(item.position, canvasWidth, canvasHeight, watermarkWidth, watermarkHeight);
		drawSingleImageWatermark(ctx, watermarkImage, item, pos.x, pos.y, watermarkWidth, watermarkHeight);
	}
}

/**
 * 应用单个水印
 */
async function applySingleWatermark(
	ctx: CanvasRenderingContext2D,
	item: WatermarkItem,
	canvasWidth: number,
	canvasHeight: number
): Promise<void> {
	if (!item.enabled) return;

	if (item.type === 'text' && item.text) {
		drawTextWatermark(ctx, item, canvasWidth, canvasHeight);
	} else if (item.type === 'image' && item.imageUrl) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				drawImageWatermark(ctx, img, item, canvasWidth, canvasHeight);
				resolve();
			};
			img.onerror = reject;
			img.src = item.imageUrl!;
		});
	}
}

/**
 * 应用所有水印到 Canvas
 */
export async function applyWatermarks(
	ctx: CanvasRenderingContext2D,
	watermarks: WatermarkItem[],
	canvasWidth: number,
	canvasHeight: number
): Promise<void> {
	for (const item of watermarks) {
		await applySingleWatermark(ctx, item, canvasWidth, canvasHeight);
	}
}

/**
 * 生成预览
 */
export async function generatePreview(
	sourceImage: HTMLImageElement,
	watermarks: WatermarkItem[]
): Promise<string> {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	if (!ctx) {
		throw new Error('无法创建 Canvas 上下文');
	}

	canvas.width = sourceImage.naturalWidth;
	canvas.height = sourceImage.naturalHeight;

	ctx.drawImage(sourceImage, 0, 0);
	await applyWatermarks(ctx, watermarks, canvas.width, canvas.height);

	return canvas.toDataURL('image/png');
}

/**
 * 导出带水印的图片
 */
export async function exportWatermarkedImage(
	sourceImage: HTMLImageElement,
	watermarks: WatermarkItem[],
	format: string = 'image/png',
	quality: number = 0.92
): Promise<Blob> {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	if (!ctx) {
		throw new Error('无法创建 Canvas 上下文');
	}

	canvas.width = sourceImage.naturalWidth;
	canvas.height = sourceImage.naturalHeight;

	ctx.drawImage(sourceImage, 0, 0);
	await applyWatermarks(ctx, watermarks, canvas.width, canvas.height);

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error('导出失败'));
				}
			},
			format,
			quality
		);
	});
}
