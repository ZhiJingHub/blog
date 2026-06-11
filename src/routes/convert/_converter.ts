import type { ConvertOptions, ConvertResult, OutputFormat, WatermarkOptions } from './_types';
import { getWatermarkPosition } from '$lib/utils/watermark-position';

/**
 * 绘制文字水印
 */
function drawTextWatermark(
  ctx: CanvasRenderingContext2D,
  options: WatermarkOptions,
  canvasWidth: number,
  canvasHeight: number
): void {
  const fontSize = options.fontSize || 24;
  const fontFamily = 'Arial, sans-serif';
  ctx.font = `${fontSize}px ${fontFamily}`;

  const textMetrics = ctx.measureText(options.text);
  const textWidth = textMetrics.width;
  const textHeight = fontSize;

  ctx.save();
  ctx.globalAlpha = options.opacity;
  ctx.fillStyle = options.color;

  if (options.position === 'tile') {
    // 平铺模式
    const spacing = options.tileSpacing || 100;
    const rotation = (options.rotation * Math.PI) / 180;

    for (let y = -canvasHeight; y < canvasHeight * 2; y += spacing) {
      for (let x = -canvasWidth; x < canvasWidth * 2; x += spacing) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.fillText(options.text, 0, 0);
        ctx.restore();
      }
    }
  } else {
    // 固定位置模式
    const pos = getWatermarkPosition(options.position, canvasWidth, canvasHeight, textWidth, textHeight);

    ctx.save();
    ctx.translate(pos.x + textWidth / 2, pos.y + textHeight / 2);
    ctx.rotate((options.rotation * Math.PI) / 180);
    ctx.fillText(options.text, -textWidth / 2, textHeight / 2);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 绘制图片水印
 */
function drawImageWatermark(
  ctx: CanvasRenderingContext2D,
  watermarkImage: HTMLImageElement,
  options: WatermarkOptions,
  canvasWidth: number,
  canvasHeight: number
): void {
  const size = options.imageSize || 100;
  const aspectRatio = watermarkImage.naturalWidth / watermarkImage.naturalHeight;
  const watermarkWidth = size;
  const watermarkHeight = size / aspectRatio;

  ctx.save();
  ctx.globalAlpha = options.opacity;

  if (options.position === 'tile') {
    // 平铺模式
    const spacing = options.tileSpacing || 100;

    for (let y = -watermarkHeight; y < canvasHeight + watermarkHeight; y += watermarkHeight + spacing) {
      for (let x = -watermarkWidth; x < canvasWidth + watermarkWidth; x += watermarkWidth + spacing) {
        ctx.drawImage(watermarkImage, x, y, watermarkWidth, watermarkHeight);
      }
    }
  } else {
    // 固定位置模式
    const pos = getWatermarkPosition(options.position, canvasWidth, canvasHeight, watermarkWidth, watermarkHeight);
    ctx.drawImage(watermarkImage, pos.x, pos.y, watermarkWidth, watermarkHeight);
  }

  ctx.restore();
}

/**
 * 应用水印到 Canvas
 */
export async function applyWatermark(
  ctx: CanvasRenderingContext2D,
  watermarkOptions: WatermarkOptions,
  canvasWidth: number,
  canvasHeight: number
): Promise<void> {
  if (!watermarkOptions.enabled || !watermarkOptions.text && watermarkOptions.type === 'text') {
    return;
  }

  if (watermarkOptions.type === 'text') {
    drawTextWatermark(ctx, watermarkOptions, canvasWidth, canvasHeight);
  } else if (watermarkOptions.type === 'image' && watermarkOptions.imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        drawImageWatermark(ctx, img, watermarkOptions, canvasWidth, canvasHeight);
        resolve();
      };
      img.onerror = reject;
      img.src = watermarkOptions.imageUrl!;
    });
  }
}

/**
 * 将图片转换为 SVG 格式
 */
function convertToSVG(
  source: HTMLImageElement,
  options: ConvertOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('无法创建 Canvas 上下文'));
      return;
    }

    const width = options.width || source.naturalWidth;
    const height = options.height || source.naturalHeight;

    canvas.width = width;
    canvas.height = height;

    // 如果有背景色需求
    if (options.backgroundColor) {
      ctx.fillStyle = options.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(source, 0, 0, width, height);

    // 将 Canvas 转为 data URL
    const dataUrl = canvas.toDataURL('image/png');
    const quality = Math.round(options.quality * 100);

    // 构建 SVG
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image xlink:href="${dataUrl}" width="${width}" height="${height}"
         style="image-rendering: ${quality > 80 ? 'optimizeQuality' : 'optimizeSpeed'}"/>
</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    resolve(blob);
  });
}

/**
 * 转换图片格式
 */
export async function convertImage(
  source: HTMLImageElement,
  options: ConvertOptions
): Promise<Blob> {
  // SVG 格式特殊处理
  if (options.format === 'image/svg+xml') {
    return convertToSVG(source, options);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法创建 Canvas 上下文');
  }

  const srcWidth = source.naturalWidth;
  const srcHeight = source.naturalHeight;
  const targetWidth = options.width || srcWidth;
  const targetHeight = options.height || srcHeight;

  // 判断是否需要旋转（90度或270度会交换宽高）
  const isRotated = options.rotation === 90 || options.rotation === 270;

  // 设置画布尺寸（考虑旋转）
  canvas.width = isRotated ? targetHeight : targetWidth;
  canvas.height = isRotated ? targetWidth : targetHeight;

  // 保存状态
  ctx.save();

  // 移动到中心点进行变换
  ctx.translate(canvas.width / 2, canvas.height / 2);

  // 应用旋转
  if (options.rotation) {
    ctx.rotate((options.rotation * Math.PI) / 180);
  }

  // 应用翻转
  if (options.flipH) {
    ctx.scale(-1, 1);
  }
  if (options.flipV) {
    ctx.scale(1, -1);
  }

  // 如果输出格式是 JPG 或 BMP 且原图可能有透明度，填充背景色
  if (options.format === 'image/jpeg' || options.format === 'image/bmp') {
    ctx.fillStyle = options.backgroundColor || '#ffffff';
    // 需要在绘制图片之前填充背景
    ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
  }

  // 绘制图片（从中心点绘制）
  ctx.drawImage(
    source,
    -targetWidth / 2,
    -targetHeight / 2,
    targetWidth,
    targetHeight
  );

  // 恢复状态
  ctx.restore();

  // 应用水印
  if (options.watermark?.enabled) {
    await applyWatermark(ctx, options.watermark, canvas.width, canvas.height);
  }

  // 导出为指定格式和质量
  return new Promise((blobResolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          blobResolve(blob);
        } else {
          reject(new Error('图片转换失败'));
        }
      },
      options.format,
      options.quality
    );
  });
}

/**
 * 执行完整的转换流程
 */
export async function performConversion(
  source: HTMLImageElement,
  originalSize: number,
  options: ConvertOptions
): Promise<ConvertResult> {
  const blob = await convertImage(source, options);
  const url = URL.createObjectURL(blob);

  return {
    blob,
    url,
    width: options.width || source.naturalWidth,
    height: options.height || source.naturalHeight,
    originalSize,
    convertedSize: blob.size
  };
}

/**
 * 获取格式对应的文件扩展名
 */
export function getFormatExtension(format: OutputFormat): string {
  const extensions: Record<OutputFormat, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/avif': '.avif',
    'image/bmp': '.bmp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg'
  };
  return extensions[format];
}

/**
 * 检查格式是否支持质量参数
 */
export function formatSupportsQuality(format: OutputFormat): boolean {
  // PNG、BMP、GIF、SVG 不支持质量参数
  return !['image/png', 'image/bmp', 'image/gif', 'image/svg+xml'].includes(format);
}

/**
 * 下载转换后的文件
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
