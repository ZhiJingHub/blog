/**
 * 共享图片工具函数 —— 供 ptg / convert / watermark 路由复用
 */

export interface LoadedImage {
	file: File;
	url: string;
	img: HTMLImageElement;
	width: number;
	height: number;
}

/** 加载图片文件，返回 Blob URL 和尺寸 */
export function loadImage(file: File): Promise<LoadedImage> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => resolve({ file, url, img, width: img.naturalWidth, height: img.naturalHeight });
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('无法加载图片文件'));
		};
		img.src = url;
	});
}

/** 释放 Blob URL */
export function revokeUrl(url: string): void {
	URL.revokeObjectURL(url);
}

/** 格式化文件大小 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	const k = 1024;
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
}
