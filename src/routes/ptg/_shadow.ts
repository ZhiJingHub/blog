import type { LoadedImage } from '$lib/utils/image';
import { clamp, convertGray } from './_image-utils';

export interface ShadowParams {
	sourceImage: LoadedImage;
	hiddenImage: LoadedImage;
	isColored: boolean;
	innerScale: number;
	coverScale: number;
	innerDesat: number;
	coverDesat: number;
	innerWeight: number;
	maxSize: number;
}

export function generateShadow(
	canvas: HTMLCanvasElement,
	params: ShadowParams
): Promise<{ url: string; width: number; height: number }> {
	const innerImg = params.hiddenImage;
	const coverImg = params.sourceImage;

	let w = innerImg.width;
	let h = innerImg.height;
	const ms = Math.max(0, Math.floor(params.maxSize));
	if (ms) {
		if (innerImg.width >= innerImg.height) {
			w = ms;
			h = Math.ceil((innerImg.height * ms) / innerImg.width);
		} else {
			h = ms;
			w = Math.ceil((innerImg.width * ms) / innerImg.height);
		}
	}

	const ic = document.createElement('canvas');
	ic.width = w;
	ic.height = h;
	const ictx = ic.getContext('2d');
	const cc = document.createElement('canvas');
	cc.width = w;
	cc.height = h;
	const cctx = cc.getContext('2d');
	canvas.width = w;
	canvas.height = h;
	const oc = canvas.getContext('2d');
	if (!ictx || !cctx || !oc) throw new Error('浏览器不支持幻影坦克所需 Canvas');

	ictx.drawImage(innerImg.image, 0, 0, w, h);

	const cr = coverImg.width / coverImg.height;
	const tr = w / h;
	let dx = 0, dy = 0, dw = w, dh = h;
	if (cr < tr) {
		dh = Math.ceil(w / cr);
		dy = Math.ceil((h - dh) / 2);
	} else {
		dw = Math.ceil(h * cr);
		dx = Math.ceil((w - dw) / 2);
	}
	cctx.drawImage(coverImg.image, dx, dy, dw, dh);

	const innerData = ictx.getImageData(0, 0, w, h);
	const coverData = cctx.getImageData(0, 0, w, h);

	const innerGray = convertGray(innerData);
	const coverGray = convertGray(coverData);
	const ip = innerData.data;
	const cp = coverData.data;
	const od = new Uint8ClampedArray(ip.length);
	const isc = params.innerScale;
	const csc = 1 - params.coverScale;

	if (params.isColored) {
		const ic2 = new Uint8ClampedArray(ip.length);
		const cc2 = new Uint8ClampedArray(cp.length);
		const ac = new Float32Array(innerGray.length);

		for (let i = 0; i < ip.length; i += 4) {
			const g = innerGray[i >> 2] * isc;
			const R = ip[i] * isc;
			const G = ip[i + 1] * isc;
			const B = ip[i + 2] * isc;
			ic2[i] = R + (g - R) * params.innerDesat;
			ic2[i + 1] = G + (g - G) * params.innerDesat;
			ic2[i + 2] = B + (g - B) * params.innerDesat;
		}

		for (let i = 0; i < cp.length; i += 4) {
			const g = 255 - (255 - coverGray[i >> 2]) * csc;
			const R = 255 - (255 - cp[i]) * csc;
			const G = 255 - (255 - cp[i + 1]) * csc;
			const B = 255 - (255 - cp[i + 2]) * csc;
			cc2[i] = R + (g - R) * params.coverDesat;
			cc2[i + 1] = G + (g - G) * params.coverDesat;
			cc2[i + 2] = B + (g - B) * params.coverDesat;
		}

		for (let i = 0; i < innerGray.length; i++)
			ac[i] = clamp(
				(255 + innerGray[i] * isc - (255 - (255 - coverGray[i]) * csc)) / 255, 0, 1
			);

		for (let i = 0; i < ip.length; i += 4) {
			const a = ac[i >> 2];
			const ac2 = 255 * a;
			const sa = Math.max(a, 0.0001);
			od[i] = clamp(
				((ic2[i] - ac2 + 255 - cc2[i]) * params.innerWeight + ac2 - 255 + cc2[i]) / sa, 0, 255
			);
			od[i + 1] = clamp(
				((ic2[i + 1] - ac2 + 255 - cc2[i + 1]) * params.innerWeight + ac2 - 255 + cc2[i + 1]) / sa, 0, 255
			);
			od[i + 2] = clamp(
				((ic2[i + 2] - ac2 + 255 - cc2[i + 2]) * params.innerWeight + ac2 - 255 + cc2[i + 2]) / sa, 0, 255
			);
			od[i + 3] = clamp(255 * a, 0, 255);
		}
	} else {
		for (let i = 0; i < innerGray.length; i++) {
			const inner = innerGray[i] * isc;
			const alpha = 255 + inner - (255 - (255 - coverGray[i]) * csc);
			const sa = Math.max(alpha, 0.0001);
			const color = clamp((255 * inner) / sa, 0, 255);
			od[i << 2] = color;
			od[(i << 2) + 1] = color;
			od[(i << 2) + 2] = color;
			od[(i << 2) + 3] = clamp(alpha, 0, 255);
		}
	}

	oc.putImageData(new ImageData(od, w, h), 0, 0);
	return new Promise<{ url: string; width: number; height: number }>((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (!blob) { reject(new Error('Canvas toBlob 失败')); return; }
			const url = URL.createObjectURL(blob);
			resolve({ url, width: w, height: h });
		}, 'image/png');
	});
}
