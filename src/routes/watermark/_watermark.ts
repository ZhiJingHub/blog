import type { WatermarkItem } from './_types';

/**
 * 获取水印位置坐标
 */
function getPosition(
  position: WatermarkItem['position'],
  canvasWidth: number,
  canvasHeight: number,
  watermarkWidth: number,
  watermarkHeight: number,
  margin: number = 20
): { x: number; y: number } {
  switch (position) {
    case 'top-left':
      return { x: margin, y: margin };
    case 'top-right':
      return { x: canvasWidth - watermarkWidth - margin, y: margin };
    case 'bottom-left':
      return { x: margin, y: canvasHeight - watermarkHeight - margin };
    case 'bottom-right':
      return { x: canvasWidth - watermarkWidth - margin, y: canvasHeight - watermarkHeight - margin };
    case 'center':
      return { x: (canvasWidth - watermarkWidth) / 2, y: (canvasHeight - watermarkHeight) / 2 };
    default:
      return { x: margin, y: margin };
  }
}

/**
 * 绘制单个文字水印
 */
function drawSingleTextWatermark(
  ctx: CanvasRenderingContext2D,
  item: WatermarkItem,
  x: number,
  y: number
): void {
  const fontSize = item.fontSize || 24;
  const fontFamily = item.fontFamily || 'Arial, sans-serif';
  ctx.font = `${fontSize}px ${fontFamily}`;

  const textMetrics = ctx.measureText(item.text);
  const textWidth = textMetrics.width;
  const textHeight = fontSize;

  ctx.save();
  ctx.globalAlpha = item.opacity;
  ctx.fillStyle = item.color;

  ctx.translate(x + textWidth / 2, y + textHeight / 2);
  ctx.rotate((item.rotation * Math.PI) / 180);
  ctx.fillText(item.text, -textWidth / 2, textHeight / 2);

  ctx.restore();
}

/**
 * 绘制文字水印
 */
function drawTextWatermark(
  ctx: CanvasRenderingContext2D,
  item: WatermarkItem,
  canvasWidth: number,
  canvasHeight: number
): void {
  const fontSize = item.fontSize || 24;
  const fontFamily = item.fontFamily || 'Arial, sans-serif';
  ctx.font = `${fontSize}px ${fontFamily}`;

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
  } else {
    // 固定位置模式
    const pos = getPosition(item.position, canvasWidth, canvasHeight, textWidth, textHeight);
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

  if (item.position === 'tile') {
    // 平铺模式
    const spacing = item.tileSpacing || 100;

    for (let y = -watermarkHeight; y < canvasHeight + watermarkHeight; y += watermarkHeight + spacing) {
      for (let x = -watermarkWidth; x < canvasWidth + watermarkWidth; x += watermarkWidth + spacing) {
        drawSingleImageWatermark(ctx, watermarkImage, item, x, y, watermarkWidth, watermarkHeight);
      }
    }
  } else {
    // 固定位置模式
    const pos = getPosition(item.position, canvasWidth, canvasHeight, watermarkWidth, watermarkHeight);
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
