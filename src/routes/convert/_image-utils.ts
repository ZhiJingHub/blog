import type { LoadedImage, OutputFormat } from './_types';

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
 * 检测浏览器是否支持 WebP 格式
 */
export async function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webp = new Image();
    webp.onload = () => resolve(true);
    webp.onerror = () => resolve(false);
    webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
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

/**
 * 获取格式的详细信息
 */
export function getFormatInfo(format: OutputFormat): {
  label: string;
  extension: string;
  description: string;
  supportsTransparency: boolean;
  supportsAnimation: boolean;
} {
  const formatMap: Record<OutputFormat, {
    label: string;
    extension: string;
    description: string;
    supportsTransparency: boolean;
    supportsAnimation: boolean;
  }> = {
    'image/png': {
      label: 'PNG',
      extension: '.png',
      description: '无损压缩，支持透明',
      supportsTransparency: true,
      supportsAnimation: false
    },
    'image/jpeg': {
      label: 'JPEG',
      extension: '.jpg',
      description: '有损压缩，文件更小',
      supportsTransparency: false,
      supportsAnimation: false
    },
    'image/webp': {
      label: 'WebP',
      extension: '.webp',
      description: '现代格式，体积更小',
      supportsTransparency: true,
      supportsAnimation: true
    },
    'image/avif': {
      label: 'AVIF',
      extension: '.avif',
      description: '最新格式，压缩率最高',
      supportsTransparency: true,
      supportsAnimation: true
    },
    'image/bmp': {
      label: 'BMP',
      extension: '.bmp',
      description: '位图格式，无压缩',
      supportsTransparency: false,
      supportsAnimation: false
    },
    'image/gif': {
      label: 'GIF',
      extension: '.gif',
      description: '支持动画和透明',
      supportsTransparency: true,
      supportsAnimation: true
    },
    'image/svg+xml': {
      label: 'SVG',
      extension: '.svg',
      description: '矢量格式，可缩放',
      supportsTransparency: true,
      supportsAnimation: true
    }
  };

  return formatMap[format];
}
