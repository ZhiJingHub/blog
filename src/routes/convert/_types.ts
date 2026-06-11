import type { WatermarkPosition } from '$lib/types/watermark';

export interface WatermarkOptions {
  enabled: boolean;
  type: 'text' | 'image';

  // 文字水印选项
  text: string;
  fontSize: number;
  color: string;

  // 通用选项
  opacity: number;
  rotation: number;

  // 位置选项
  position: WatermarkPosition;

  // 图片水印选项
  imageUrl?: string;
  imageFile?: File;
  imageSize: number;

  // 平铺选项
  tileSpacing: number;
}

export interface ConvertOptions {
  format: OutputFormat;
  quality: number; // 0-1
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
  backgroundColor?: string;
  customFilename?: string;
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  watermark: WatermarkOptions;
}

export type OutputFormat =
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'
  | 'image/avif'
  | 'image/bmp'
  | 'image/gif'
  | 'image/svg+xml';

export interface ConvertResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  originalSize: number;
  convertedSize: number;
}

export const FORMAT_OPTIONS: {
  value: OutputFormat;
  label: string;
  extension: string;
  description: string;
}[] = [
  { value: 'image/png', label: 'PNG', extension: '.png', description: '无损压缩，支持透明' },
  { value: 'image/jpeg', label: 'JPEG', extension: '.jpg', description: '有损压缩，文件更小' },
  { value: 'image/webp', label: 'WebP', extension: '.webp', description: '现代格式，体积更小' },
  { value: 'image/avif', label: 'AVIF', extension: '.avif', description: '最新格式，压缩率最高' },
  { value: 'image/bmp', label: 'BMP', extension: '.bmp', description: '位图格式，无压缩' },
  { value: 'image/gif', label: 'GIF', extension: '.gif', description: '支持动画和透明' },
  { value: 'image/svg+xml', label: 'SVG', extension: '.svg', description: '矢量格式，可缩放' }
];

export const PRESET_SCALES = [
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1 },
  { label: '150%', value: 1.5 },
  { label: '200%', value: 2 },
  { label: '300%', value: 3 }
];

export interface CompressionPreset {
  label: string;
  description: string;
  format: OutputFormat;
  quality: number;
  icon: string;
}

export const COMPRESSION_PRESETS: CompressionPreset[] = [
  {
    label: '网页优化',
    description: 'WebP 格式，平衡质量和大小',
    format: 'image/webp',
    quality: 0.8,
    icon: 'mdi:web'
  },
  {
    label: '高质量',
    description: 'PNG 无损压缩',
    format: 'image/png',
    quality: 1,
    icon: 'mdi:quality-high'
  },
  {
    label: '最小体积',
    description: 'JPEG 低质量，文件最小',
    format: 'image/jpeg',
    quality: 0.6,
    icon: 'mdi:zip-box'
  },
  {
    label: '社交媒体',
    description: 'JPEG 中等质量',
    format: 'image/jpeg',
    quality: 0.85,
    icon: 'mdi:share-variant'
  }
];

export interface BatchItem {
  id: string;
  file: File;
  url: string;
  img: HTMLImageElement;
  width: number;
  height: number;
  status: 'pending' | 'converting' | 'done' | 'error';
  result?: ConvertResult;
  error?: string;
}
