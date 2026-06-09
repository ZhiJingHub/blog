import type { ConvertOptions, ConvertResult, OutputFormat } from './_types';

/**
 * 转换图片格式
 */
export async function convertImage(
  source: HTMLImageElement,
  options: ConvertOptions
): Promise<Blob> {
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
    'image/gif': '.gif'
  };
  return extensions[format];
}

/**
 * 检查格式是否支持质量参数
 */
export function formatSupportsQuality(format: OutputFormat): boolean {
  // PNG、BMP、GIF 不支持质量参数
  return !['image/png', 'image/bmp', 'image/gif'].includes(format);
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
