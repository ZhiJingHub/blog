import type { WatermarkPosition } from '$lib/types/watermark';

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
  position: WatermarkPosition;
  tileSpacing: number;
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
