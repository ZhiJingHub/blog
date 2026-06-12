/**
 * 共享图片工具函数 —— 供 ptg / convert / watermark 路由复用
 */

export interface LoadedImage {
	file: File;
	name: string;
	url: string;
	img: HTMLImageElement;
	/** @alias img — 兼容 ptg 路由 */
	image: HTMLImageElement;
	width: number;
	height: number;
}

/** 加载图片文件，返回 Blob URL 和尺寸 */
export function loadImage(file: File): Promise<LoadedImage> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () =>
			resolve({
				file,
				name: file.name,
				url,
				img,
				image: img,
				width: img.naturalWidth,
				height: img.naturalHeight
			});
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
	if (bytes < 0) return '-' + formatFileSize(-bytes);
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	const k = 1024;
	const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
}
