import type { LoadedImage } from '$lib/utils/image';
import { adjustPixelBrightnessContrast } from './_image-utils';

export interface PrismParams {
	sourceImage: LoadedImage;
	hiddenImage: LoadedImage;
	brightness: number;
	contrast: number;
	hiddenBrightness: number;
	hiddenContrast: number;
}

export function generatePrism(
	canvas: HTMLCanvasElement,
	params: PrismParams
): Promise<{ url: string; width: number; height: number }> {
	const w = params.sourceImage.width;
	const h = params.sourceImage.height;

	canvas.width = w;
	canvas.height = h;
	const oc = canvas.getContext('2d');
	if (!oc) throw new Error('浏览器不支持 Canvas');

	const bc = document.createElement('canvas');
	bc.width = w;
	bc.height = h;
	const bctx = bc.getContext('2d');
	const ovc = document.createElement('canvas');
	ovc.width = w;
	ovc.height = h;
	const ovctx = ovc.getContext('2d');
	if (!bctx || !ovctx) throw new Error('浏览器不支持离屏 Canvas');

	bctx.drawImage(params.sourceImage.image, 0, 0, w, h);
	ovctx.drawImage(params.hiddenImage.image, 0, 0, w, h);

	const baseData = bctx.getImageData(0, 0, w, h);
	const overlayData = ovctx.getImageData(0, 0, w, h);
	const res = oc.createImageData(w, h);

	const oB = 1 + params.brightness / 100;
	const hB = 1 - params.hiddenBrightness / 100;
	const oC = params.contrast / 100;
	const hC = params.hiddenContrast / 100;

	for (let i = 0; i < baseData.data.length; i += 4) {
		const px = i / 4;
		const x = px % w;
		const y = Math.floor(px / w);

		let r: number, g: number, b: number;
		if ((x + y) % 2 === 0) {
			const p = adjustPixelBrightnessContrast(
				baseData.data[i], baseData.data[i + 1], baseData.data[i + 2], oB, oC
			);
			r = p[0]; g = p[1]; b = p[2];
		} else {
			const p = adjustPixelBrightnessContrast(
				overlayData.data[i], overlayData.data[i + 1], overlayData.data[i + 2], hB, hC
			);
			r = p[0]; g = p[1]; b = p[2];
		}
		res.data[i] = r;
		res.data[i + 1] = g;
		res.data[i + 2] = b;
		res.data[i + 3] = 255;
	}

	oc.putImageData(res, 0, 0);
	return new Promise<{ url: string; width: number; height: number }>((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (!blob) { reject(new Error('Canvas toBlob 失败')); return; }
			const url = URL.createObjectURL(blob);
			resolve({ url, width: w, height: h });
		}, 'image/png');
	});
}
