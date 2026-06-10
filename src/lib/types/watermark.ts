export type WatermarkPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'tile' | 'diagonal-tile' | 'border' | 'band';

export type WatermarkStyle = 'default' | 'emboss' | 'shadow' | 'gradient';

export const WATERMARK_POSITIONS: { value: WatermarkPosition; label: string }[] = [
	{ value: 'top-left', label: '左上' },
	{ value: 'top-right', label: '右上' },
	{ value: 'center', label: '居中' },
	{ value: 'bottom-left', label: '左下' },
	{ value: 'bottom-right', label: '右下' },
	{ value: 'tile', label: '平铺' },
	{ value: 'diagonal-tile', label: '对角平铺' },
	{ value: 'border', label: '边框' },
	{ value: 'band', label: '条带' }
];

export const WATERMARK_STYLES: { value: WatermarkStyle; label: string }[] = [
	{ value: 'default', label: '默认' },
	{ value: 'emboss', label: '浮雕' },
	{ value: 'shadow', label: '阴影' },
	{ value: 'gradient', label: '渐变' }
];
