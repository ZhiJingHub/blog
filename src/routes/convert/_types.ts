export interface ConvertOptions {
  format: OutputFormat;
  quality: number; // 0-1
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
  backgroundColor?: string;
}

export type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif';

export interface LoadedImage {
  file: File;
  url: string;
  img: HTMLImageElement;
  width: number;
  height: number;
}

export interface ConvertResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  originalSize: number;
  convertedSize: number;
}

export const FORMAT_OPTIONS: { value: OutputFormat; label: string; extension: string }[] = [
  { value: 'image/png', label: 'PNG', extension: '.png' },
  { value: 'image/jpeg', label: 'JPEG', extension: '.jpg' },
  { value: 'image/webp', label: 'WebP', extension: '.webp' },
  { value: 'image/avif', label: 'AVIF', extension: '.avif' }
];

export const PRESET_SCALES = [
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1 },
  { label: '150%', value: 1.5 },
  { label: '200%', value: 2 }
];
