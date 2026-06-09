export type WatermarkPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'tile';

export const WATERMARK_POSITIONS: { value: WatermarkPosition; label: string }[] = [
	{ value: 'top-left', label: '左上' },
	{ value: 'top-right', label: '右上' },
	{ value: 'center', label: '居中' },
	{ value: 'bottom-left', label: '左下' },
	{ value: 'bottom-right', label: '右下' },
	{ value: 'tile', label: '平铺' }
];
