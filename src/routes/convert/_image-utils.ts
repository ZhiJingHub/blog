import type { LoadedImage } from './_types';

/**
 * 加载图片文件
 */
export function loadImage(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      resolve({
        file,
        url,
        img,
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法加载图片文件'));
    };

    img.src = url;
  });
}

/**
 * 释放 Blob URL
 */
export function revokeUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
}

/**
 * 计算压缩率
 */
export function calculateCompressionRate(original: number, converted: number): number {
  if (original === 0) return 0;
  return Math.round(((original - converted) / original) * 100);
}

/**
 * 计算保持宽高比的尺寸
 */
export function calculateDimensions(
  original: { width: number; height: number },
  target: { width?: number; height?: number; maintainAspectRatio: boolean }
): { width: number; height: number } {
  if (!target.maintainAspectRatio) {
    return {
      width: target.width || original.width,
      height: target.height || original.height
    };
  }

  const aspectRatio = original.width / original.height;

  if (target.width) {
    return {
      width: target.width,
      height: Math.round(target.width / aspectRatio)
    };
  }

  if (target.height) {
    return {
      width: Math.round(target.height * aspectRatio),
      height: target.height
    };
  }

  return { width: original.width, height: original.height };
}

/**
 * 检测浏览器是否支持 AVIF 格式
 */
export async function supportsAVIF(): Promise<boolean> {
  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = () => resolve(true);
    avif.onerror = () => resolve(false);
    avif.src =
      'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
}

/**
 * 从文件名获取扩展名
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * 生成输出文件名
 */
export function generateOutputFilename(originalName: string, newExtension: string): string {
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  return `${baseName}${newExtension}`;
}
