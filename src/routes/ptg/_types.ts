export type ToolMode = 'prism' | 'shadow';
export type UploadKind = 'source' | 'hidden';

export interface LoadedImage {
	file: File;
	name: string;
	width: number;
	height: number;
	url: string;
	image: HTMLImageElement;
}

export interface ModeResult {
	url: string;
	width: number;
	height: number;
	statusMessage: string;
	errorMessage: string;
}

export const DEFAULT_SOURCE_BRIGHTNESS = 100;
export const DEFAULT_SOURCE_CONTRAST = 20;
export const DEFAULT_HIDDEN_BRIGHTNESS = 90;
export const DEFAULT_HIDDEN_CONTRAST = 100;
export const DEFAULT_SHADOWS = {
	isColored: true,
	scaleInner: 0.3,
	scaleCover: 0.2,
	desatInner: 0,
	desatCover: 0,
	weightInner: 0.7,
	maxSize: 1200
};

export const initialResults: Record<ToolMode, ModeResult> = {
	prism: {
		url: '',
		width: 0,
		height: 0,
		statusMessage: '请先上传原图与隐藏图，再生成输出 PNG。',
		errorMessage: ''
	},
	shadow: {
		url: '',
		width: 0,
		height: 0,
		statusMessage: '请先上传白底图与黑底图，再生成输出 PNG。',
		errorMessage: ''
	}
};

export const modeMetaMap = {
	prism: {
		name: '光棱坦克',
		description: '保留现有棋盘格幻影图算法，适合制作需要全局拉高亮度后才更容易识别隐藏图的 PNG。',
		sourceLabel: '原图',
		hiddenLabel: '隐藏图',
		sourceCta: '点击上传原图',
		hiddenCta: '点击上传隐藏图',
		sourceHint: '支持常见图片格式，生成时将以这张图片的宽高作为最终输出尺寸。',
		hiddenHint: '隐藏图会在生成时按原图尺寸统一缩放，并参与棋盘格交错合成。',
		emptyResultHint: '尚未生成结果。上传两张图片并调整参数后，点击"生成图像"即可在此处预览并下载 PNG。',
		resultDescription: '输出为 PNG 棋盘图。该模式严格使用原始算法，不提供黑白底双预览。'
	},
	shadow: {
		name: '幻影坦克',
		description: '使用 Mirage_Colored 核心逻辑：支持全彩输出、黑白双背景预览，以及亮度/去色/权重控制。',
		sourceLabel: '白底图',
		hiddenLabel: '黑底图',
		sourceCta: '点击上传白底图',
		hiddenCta: '点击上传黑底图',
		sourceHint: '对应源码里的表图，会在生成时按黑底图的画幅进行居中裁切适配。',
		hiddenHint: '对应源码里的里图，输出尺寸和最大尺寸缩放以这张图为基准。',
		emptyResultHint: '尚未生成结果。上传白底图与黑底图后，点击"生成图像"即可查看同一 PNG 在白底 / 黑底下的差异。',
		resultDescription: '输出为单张透明 PNG，使用 Mirage_Colored 核心像素处理逻辑，并提供白底 / 黑底双预览。'
	}
} as const;
