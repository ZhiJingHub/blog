import type { ConvertOptions, ConvertResult, OutputFormat } from './_types';

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

  // 设置尺寸
  canvas.width = options.width || source.naturalWidth;
  canvas.height = options.height || source.naturalHeight;

  // 如果输出格式是 JPG 或 BMP 且原图可能有透明度，填充背景色
  if (options.format === 'image/jpeg' || options.format === 'image/bmp') {
    ctx.fillStyle = options.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 绘制图片
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

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
 * 获取格式对应的 MIME 类型
 */
export function getMimeType(format: OutputFormat): string {
  return format;
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
