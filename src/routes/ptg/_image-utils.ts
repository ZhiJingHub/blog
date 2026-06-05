import type { LoadedImage } from './_types';

export function clamp(v: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, v));
}

export function adjustPixelBrightnessContrast(
	r: number,
	g: number,
	b: number,
	bf: number,
	cf: number
): [number, number, number] {
	const ac = (v: number) => clamp((v - 128) * cf + 128, 0, 255);
	return [ac(r * bf), ac(g * bf), ac(b * bf)];
}

export function convertGray(d: ImageData): Uint8ClampedArray {
	const r = new Uint8ClampedArray(d.data.length >> 2);
	for (let i = 0; i < d.data.length; i += 4)
		r[i >> 2] = 0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2];
	return r;
}

const fileUrls = new Set<string>();

export function revokeFileUrl(url?: string) {
	if (!url) return;
	URL.revokeObjectURL(url);
	fileUrls.delete(url);
}

export function revokeAllFileUrls() {
	for (const url of fileUrls) URL.revokeObjectURL(url);
	fileUrls.clear();
}

export function loadImage(file: File): Promise<LoadedImage> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const dataUrl = e.target?.result as string;
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => {
				const blobUrl = URL.createObjectURL(file);
				fileUrls.add(blobUrl);
				resolve({
					file,
					name: file.name,
					width: img.naturalWidth,
					height: img.naturalHeight,
					url: blobUrl,
					image: img
				});
			};
			img.onerror = () => reject(new Error('图片读取失败'));
			img.src = dataUrl;
		};
		reader.onerror = () => reject(new Error('文件读取失败'));
		reader.readAsDataURL(file);
	});
}
