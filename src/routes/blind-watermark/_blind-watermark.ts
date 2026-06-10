/**
 * 盲水印核心算法
 * 基于 DWT + DCT + SVD 三重域
 *
 * 嵌入流程：图片 → YUV → Haar DWT → LL 子带 4×4 分块 → DCT → SVD → 量化奇异值 → 逆变换
 * 提取流程：图片 → YUV → Haar DWT → LL 子带 4×4 分块 → DCT → SVD → 读取奇异值余数 → 投票解码
 *
 * 参考：guofei9987/blind_watermark
 */

import { stringToBits, bitsToString, bchEncode, bchDecode } from './_bch';
import { dwt2d, idwt2d } from './_dwt';
import { svd } from './_svd';

// ==================== 色彩空间 ====================

/** RGB 转 YUV (BT.601) */
function rgbToYuv(r: number, g: number, b: number): [number, number, number] {
	const y = 0.299 * r + 0.587 * g + 0.114 * b;
	const u = -0.169 * r - 0.331 * g + 0.5 * b + 128;
	const v = 0.5 * r - 0.419 * g - 0.081 * b + 128;
	return [y, u, v];
}

/** ImageData 转 YUV 三个通道 */
function imageDataToYuv(imageData: ImageData): { Y: Float64Array; U: Float64Array; V: Float64Array } {
	const { data, width, height } = imageData;
	const size = width * height;
	const Y = new Float64Array(size);
	const U = new Float64Array(size);
	const V = new Float64Array(size);

	for (let i = 0; i < size; i++) {
		const idx = i * 4;
		const [y, u, v] = rgbToYuv(data[idx], data[idx + 1], data[idx + 2]);
		Y[i] = y;
		U[i] = u;
		V[i] = v;
	}

	return { Y, U, V };
}

// ==================== DCT 4×4 ====================

/** 4×4 DCT 基矩阵 (预计算) */
const DCT4 = new Float64Array([
	0.5, 0.5, 0.5, 0.5,
	0.6533, 0.2706, -0.2706, -0.6533,
	0.5, -0.5, -0.5, 0.5,
	0.2706, -0.6533, 0.6533, -0.2706
]);

const DCT4T = new Float64Array([
	0.5, 0.6533, 0.5, 0.2706,
	0.5, 0.2706, -0.5, -0.6533,
	0.5, -0.2706, -0.5, 0.6533,
	0.5, -0.6533, 0.5, -0.2706
]);

/** 4×4 2D DCT: DCT4 * block * DCT4^T */
function dct4x4(block: Float64Array): Float64Array {
	const temp = new Float64Array(16);
	const result = new Float64Array(16);

	// temp = DCT4 * block
	for (let i = 0; i < 4; i++) {
		for (let j = 0; j < 4; j++) {
			let sum = 0;
			for (let k = 0; k < 4; k++) sum += DCT4[i * 4 + k] * block[k * 4 + j];
			temp[i * 4 + j] = sum;
		}
	}

	// result = temp * DCT4^T
	for (let i = 0; i < 4; i++) {
		for (let j = 0; j < 4; j++) {
			let sum = 0;
			for (let k = 0; k < 4; k++) sum += temp[i * 4 + k] * DCT4T[k * 4 + j];
			result[i * 4 + j] = sum;
		}
	}

	return result;
}

/** 4×4 2D IDCT: DCT4^T * block * DCT4 */
function idct4x4(block: Float64Array): Float64Array {
	const temp = new Float64Array(16);
	const result = new Float64Array(16);

	// temp = DCT4^T * block
	for (let i = 0; i < 4; i++) {
		for (let j = 0; j < 4; j++) {
			let sum = 0;
			for (let k = 0; k < 4; k++) sum += DCT4T[i * 4 + k] * block[k * 4 + j];
			temp[i * 4 + j] = sum;
		}
	}

	// result = temp * DCT4
	for (let i = 0; i < 4; i++) {
		for (let j = 0; j < 4; j++) {
			let sum = 0;
			for (let k = 0; k < 4; k++) sum += temp[i * 4 + k] * DCT4[k * 4 + j];
			result[i * 4 + j] = sum;
		}
	}

	return result;
}

// ==================== 分块工具 ====================

/** 从 2D 系数矩阵中提取 4×4 块 */
function extractBlocks(coeffs: Float64Array, w: number, h: number): { blocks: Float64Array[]; positions: [number, number][] } {
	const blocks: Float64Array[] = [];
	const positions: [number, number][] = [];

	for (let y = 0; y <= h - 4; y += 4) {
		for (let x = 0; x <= w - 4; x += 4) {
			const block = new Float64Array(16);
			for (let by = 0; by < 4; by++) {
				for (let bx = 0; bx < 4; bx++) {
					block[by * 4 + bx] = coeffs[(y + by) * w + (x + bx)];
				}
			}
			blocks.push(block);
			positions.push([x, y]);
		}
	}

	return { blocks, positions };
}

/** 将 4×4 块写回 2D 系数矩阵 */
function writeBlock(coeffs: Float64Array, w: number, x: number, y: number, block: Float64Array): void {
	for (let by = 0; by < 4; by++) {
		for (let bx = 0; bx < 4; bx++) {
			coeffs[(y + by) * w + (x + bx)] = block[by * 4 + bx];
		}
	}
}

// ==================== 伪随机 ====================

/** 生成洗牌索引（密码派生） */
function shuffleIndices(length: number, password: string): Uint32Array {
	let hash = 0;
	for (let i = 0; i < password.length; i++) {
		hash = ((hash << 5) - hash + password.charCodeAt(i)) | 0;
	}

	const indices = new Uint32Array(length);
	for (let i = 0; i < length; i++) indices[i] = i;

	let seed = Math.abs(hash);
	for (let i = length - 1; i > 0; i--) {
		seed = (seed * 1103515245 + 12345) & 0x7fffffff;
		const j = seed % (i + 1);
		const tmp = indices[i];
		indices[i] = indices[j];
		indices[j] = tmp;
	}

	return indices;
}

// ==================== K-means 阈值 ====================

/** 一维 K-means 聚类（用于二值化提取结果） */
function oneDimKmeans(data: number[], maxIter = 300): number {
	if (data.length === 0) return 0.5;

	// 初始化两个中心为 min 和 max
	let c0 = Math.min(...data);
	let c1 = Math.max(...data);
	if (c0 === c1) return c0;

	for (let iter = 0; iter < maxIter; iter++) {
		let sum0 = 0, count0 = 0, sum1 = 0, count1 = 0;

		for (const x of data) {
			if (Math.abs(x - c0) < Math.abs(x - c1)) {
				sum0 += x;
				count0++;
			} else {
				sum1 += x;
				count1++;
			}
		}

		const newC0 = count0 > 0 ? sum0 / count0 : c0;
		const newC1 = count1 > 0 ? sum1 / count1 : c1;

		if (Math.abs(newC0 - c0) < 1e-10 && Math.abs(newC1 - c1) < 1e-10) break;
		c0 = newC0;
		c1 = newC1;
	}

	return (c0 + c1) / 2;
}

// ==================== 公开 API ====================

export interface BlindWatermarkOptions {
	password: string;
	strength: number; // 量化步长 d1，推荐 30-50
}

export interface BlindWatermarkResult {
	imageData: ImageData;
	embeddedBits: number;
	totalBlocks: number;
	psnr: number;
}

/** 计算 PSNR */
function calculatePSNR(original: ImageData, modified: ImageData): number {
	const { data: o, width, height } = original;
	const { data: m } = modified;
	let mse = 0;
	for (let i = 0; i < width * height * 4; i += 4) {
		for (let c = 0; c < 3; c++) {
			const diff = o[i + c] - m[i + c];
			mse += diff * diff;
		}
	}
	mse /= width * height * 3;
	if (mse === 0) return Infinity;
	return 10 * Math.log10((255 * 255) / mse);
}

/**
 * 嵌入盲水印
 */
export function embedBlindWatermark(
	imageData: ImageData,
	text: string,
	options: BlindWatermarkOptions
): BlindWatermarkResult {
	const { width, height } = imageData;
	const size = width * height;

	// 1. 提取 Y 通道
	const { data } = imageData;
	const Y = new Float64Array(size);
	for (let i = 0; i < size; i++) {
		const idx = i * 4;
		Y[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
	}

	// 保存原始 Y 用于计算差值
	const originalY = new Float64Array(Y);

	// 2. Haar DWT 分解
	const { ll, lh, hl, hh, w: w2, h: h2 } = dwt2d(Y, width, height);

	// 3. 将文本编码为比特流
	const payloadBits = stringToBits(text);
	const encodedBits = bchEncode(payloadBits);

	if (encodedBits.length === 0) {
		throw new Error('水印内容不能为空');
	}

	// 4. 对 LL 子带分 4×4 块
	const { blocks, positions } = extractBlocks(ll, w2, h2);
	if (blocks.length === 0) {
		throw new Error('图片太小，无法嵌入水印');
	}

	// 5. 生成洗牌索引
	const shuffler = shuffleIndices(blocks.length, options.password);

	// 6. 量化步长
	const d1 = options.strength;

	// 7. 循环嵌入：每个比特嵌入到所有块中
	for (let b = 0; b < blocks.length; b++) {
		const blockIdx = shuffler[b];
		const block = blocks[blockIdx];
		const wmBit = encodedBits[b % encodedBits.length];

		// DCT
		const dctBlock = dct4x4(block);

		// SVD
		const { U: u, s, V: v } = svd(dctBlock, 4, 4);

		// 量化 s[0] 嵌入比特
		s[0] = (Math.floor(s[0] / d1) + 0.25 + 0.5 * wmBit) * d1;

		// 重构 DCT 块: U * diag(s) * V^T
		const reconstructed = new Float64Array(16);
		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 4; j++) {
				let sum = 0;
				for (let k = 0; k < 4; k++) sum += u[i * 4 + k] * s[k] * v[j * 4 + k];
				reconstructed[i * 4 + j] = sum;
			}
		}

		// IDCT
		blocks[blockIdx] = idct4x4(reconstructed);
	}

	// 7. 将块写回 LL 子带
	for (let b = 0; b < blocks.length; b++) {
		const [x, y] = positions[b];
		writeBlock(ll, w2, x, y, blocks[b]);
	}

	// 8. Haar IDWT 重构 Y 通道
	const newY = idwt2d(ll, lh, hl, hh, w2, h2, width, height);

	// 9. 计算 Y 通道差值，应用到原始 RGB（保持颜色）
	const result = new ImageData(new Uint8ClampedArray(data), width, height);
	for (let i = 0; i < size; i++) {
		const delta = newY[i] - originalY[i];
		const idx = i * 4;
		result.data[idx] = Math.max(0, Math.min(255, data[idx] + delta));
		result.data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + delta));
		result.data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + delta));
	}

	const psnr = calculatePSNR(imageData, result);

	return {
		imageData: result,
		embeddedBits: encodedBits.length,
		totalBlocks: blocks.length,
		psnr
	};
}

/**
 * 提取盲水印
 */
export function extractBlindWatermark(
	imageData: ImageData,
	options: BlindWatermarkOptions,
	expectedLength: number = 256
): string | null {
	const { width, height } = imageData;

	// 1. RGB → YUV
	const { Y } = imageDataToYuv(imageData);

	// 2. Haar DWT
	const { ll, w: w2, h: h2 } = dwt2d(Y, width, height);

	// 3. 分块
	const { blocks } = extractBlocks(ll, w2, h2);
	if (blocks.length === 0) return null;

	// 4. 洗牌索引
	const shuffler = shuffleIndices(blocks.length, options.password);
	const d1 = options.strength;

	// 5. 从每个块提取比特
	const maxBits = Math.min(blocks.length, 512);
	const extractedRaw: number[][] = Array.from({ length: maxBits }, () => []);

	for (let b = 0; b < blocks.length; b++) {
		const blockIdx = shuffler[b];
		const block = blocks[blockIdx];

		// DCT → SVD
		const dctBlock = dct4x4(block);
		const { s } = svd(dctBlock, 4, 4);

		// 提取比特: s[0] % d1 > d1/2 ?
		const remainder = s[0] % d1;
		const bit = remainder > d1 / 2 ? 1 : 0;

		const bitIdx = b % maxBits;
		extractedRaw[bitIdx].push(bit);
	}

	// 6. 对每个比特位置取平均，然后用 K-means 阈值化
	const averages = extractedRaw.map((votes) => {
		if (votes.length === 0) return 0;
		return votes.reduce((a, b) => a + b, 0) / votes.length;
	});

	const threshold = oneDimKmeans(averages);
	const extracted: number[] = averages.map((avg) => (avg > threshold ? 1 : 0));

	// 7. BCH 解码
	const decodedBits = bchDecode(extracted, expectedLength);

	// 8. 解码为字符串
	return bitsToString(decodedBits);
}

/**
 * 批量嵌入盲水印
 */
export async function batchEmbed(
	images: { file: File; imageData: ImageData }[],
	text: string,
	options: BlindWatermarkOptions,
	onProgress?: (current: number, total: number) => void
): Promise<{ file: File; blob: Blob }[]> {
	const results: { file: File; blob: Blob }[] = [];

	for (let i = 0; i < images.length; i++) {
		const { file, imageData } = images[i];
		const result = embedBlindWatermark(
			new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height),
			text,
			options
		);

		const canvas = document.createElement('canvas');
		canvas.width = result.imageData.width;
		canvas.height = result.imageData.height;
		const ctx = canvas.getContext('2d')!;
		ctx.putImageData(result.imageData, 0, 0);

		const blob = await new Promise<Blob>((resolve, reject) => {
			canvas.toBlob((b) => b ? resolve(b) : reject(new Error('导出失败')), 'image/png');
		});

		results.push({ file, blob });
		onProgress?.(i + 1, images.length);
	}

	return results;
}

/**
 * 批量提取盲水印
 */
export async function batchExtract(
	images: ImageData[],
	options: BlindWatermarkOptions,
	expectedLength: number = 256
): Promise<(string | null)[]> {
	return images.map((imageData) => extractBlindWatermark(imageData, options, expectedLength));
}
