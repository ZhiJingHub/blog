export interface WatermarkItem {
  id: string;
  type: 'text' | 'image';
  enabled: boolean;

  // 文字水印
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;

  // 图片水印
  imageUrl?: string;
  imageFile?: File;
  imageSize: number;

  // 通用设置
  opacity: number;
  rotation: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'tile';
  tileSpacing: number;
}

export interface LoadedWatermarkImage {
  file: File;
  url: string;
  img: HTMLImageElement;
  width: number;
  height: number;
}

export const DEFAULT_WATERMARK: Omit<WatermarkItem, 'id'> = {
  type: 'text',
  enabled: true,
  text: '水印文字',
  fontSize: 24,
  fontFamily: 'Arial, sans-serif',
  color: '#ffffff',
  imageUrl: undefined,
  imageFile: undefined,
  imageSize: 100,
  opacity: 0.5,
  rotation: 0,
  position: 'bottom-right',
  tileSpacing: 100
};

export const POSITION_OPTIONS = [
  { value: 'top-left', label: '左上' },
  { value: 'top-right', label: '右上' },
  { value: 'center', label: '居中' },
  { value: 'bottom-left', label: '左下' },
  { value: 'bottom-right', label: '右下' },
  { value: 'tile', label: '平铺' }
] as const;
