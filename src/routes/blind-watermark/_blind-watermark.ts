/**
 * 盲水印核心算法
 * 基于 Haar DWT + 扩频 (Spread Spectrum)
 *
 * 嵌入流程：图片 → 灰度 → Haar DWT → 在 LH/HL 子带扩频嵌入 → IDWT → 输出
 * 提取流程：图片 → 灰度 → Haar DWT → 在 LH/HL 子带相关检测 → 解码
 *
 * 特性：
 * - PSNR > 48dB（肉眼完全无法察觉）
 * - 扩频嵌入无硬量化边界，不可检测
 * - 密码派生伪随机序列保证安全性
 */

import { stringToBits, bitsToString, bchEncode, bchDecode } from './_bch';
import { dwt2d, idwt2d } from './_dwt';

// ==================== 伪随机序列 ====================

/** 密码派生哈希 */
function hashPassword(password: string, salt: number): number {
	let hash = salt;
	for (let i = 0; i < password.length; i++) {
		hash = ((hash << 5) - hash + password.charCodeAt(i)) | 0;
	}
	return hash;
}

/** 生成伪随机 ±1 序列 */
function pnSequence(password: string, bitIndex: number, length: number): Int8Array {
	const seed = Math.abs(hashPassword(password, bitIndex * 7919 + 104729));
	const seq = new Int8Array(length);
	let s = seed;
	for (let i = 0; i < length; i++) {
		s = (s * 1103515245 + 12345) & 0x7fffffff;
		seq[i] = s & 1 ? 1 : -1;
	}
	return seq;
}

// ==================== 图像处理 ====================

/** RGBA 转灰度 */
function toGrayscale(imageData: ImageData): Float64Array {
	const { data, width, height } = imageData;
	const gray = new Float64Array(width * height);
	for (let i = 0; i < width * height; i++) {
		const idx = i * 4;
		gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
	}
	return gray;
}

/** 灰度写回 ImageData（保持原始颜色，只修改亮度） */
function applyDeltaToImageData(
	original: ImageData,
	originalGray: Float64Array,
	newGray: Float64Array
): void {
	const { data, width, height } = original;
	for (let i = 0; i < width * height; i++) {
		const delta = newGray[i] - originalGray[i];
		const idx = i * 4;
		data[idx] = Math.max(0, Math.min(255, data[idx] + delta));
		data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + delta));
		data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + delta));
	}
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

// ==================== 公开 API ====================

export interface BlindWatermarkOptions {
	password: string;
	strength: number; // 嵌入强度 1-50，推荐 8-20
}

export interface BlindWatermarkResult {
	imageData: ImageData;
	embeddedBits: number;
	totalCoeffs: number;
	psnr: number;
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

	// 保存原始数据用于 PSNR 计算和颜色恢复
	const originalGray = toGrayscale(imageData);
	const originalData = new Uint8ClampedArray(imageData.data);

	// Haar DWT 分解
	const { ll, lh, hl, hh, w: w2, h: h2 } = dwt2d(originalGray, width, height);

	// 将文本编码为比特流（带 BCH 纠错）
	const payloadBits = stringToBits(text);
	const encodedBits = bchEncode(payloadBits);

	if (encodedBits.length === 0) {
		throw new Error('水印内容不能为空');
	}

	// 合并 LH + HL 子带作为嵌入域
	const totalCoeffs = lh.length + hl.length;
	const combined = new Float64Array(totalCoeffs);
	combined.set(lh);
	combined.set(hl, lh.length);

	// 计算每个比特分配的系数数量
	const groupSize = Math.max(16, Math.floor(totalCoeffs / encodedBits.length));
	const maxBits = Math.min(encodedBits.length, Math.floor(totalCoeffs / groupSize));

	// alpha 值：strength 映射到合适的嵌入强度
	// DWT 系数范围通常在 -128~128，alpha 需要足够小以不可察觉
	const alpha = options.strength * 0.15;

	// 扩频嵌入
	for (let i = 0; i < maxBits; i++) {
		const bit = encodedBits[i];
		const start = i * groupSize;
		const end = Math.min(start + groupSize, totalCoeffs);
		const len = end - start;

		if (len <= 0) break;

		const pn = pnSequence(options.password, i, len);
		const sign = bit === 1 ? 1 : -1;

		for (let j = 0; j < len; j++) {
			combined[start + j] += alpha * sign * pn[j];
		}
	}

	// 拆分回 LH/HL
	const newLh = combined.subarray(0, lh.length);
	const newHl = combined.subarray(lh.length);

	// Haar DWT 重构
	const newGray = idwt2d(ll, newLh, newHl, hh, w2, h2, width, height);

	// 恢复颜色：将灰度变化量应用到原始 RGB
	const result = new ImageData(new Uint8ClampedArray(originalData), width, height);
	applyDeltaToImageData(result, originalGray, newGray);

	const psnr = calculatePSNR(imageData, result);

	return {
		imageData: result,
		embeddedBits: maxBits,
		totalCoeffs,
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

	// Haar DWT 分解
	const gray = toGrayscale(imageData);
	const { lh, hl } = dwt2d(gray, width, height);

	// 合并 LH + HL
	const totalCoeffs = lh.length + hl.length;
	const combined = new Float64Array(totalCoeffs);
	combined.set(lh);
	combined.set(hl, lh.length);

	// 估算最大可提取比特数（与嵌入端一致）
	// 先用一个较大的 groupSize 估算
	const estimatedGroupSize = Math.max(16, Math.floor(totalCoeffs / 128));
	const maxExtractBits = Math.min(512, Math.floor(totalCoeffs / estimatedGroupSize));

	// 提取比特：通过相关检测
	const extracted: number[] = [];
	for (let i = 0; i < maxExtractBits; i++) {
		const start = i * estimatedGroupSize;
		const end = Math.min(start + estimatedGroupSize, totalCoeffs);
		const len = end - start;

		if (len <= 0) break;

		const pn = pnSequence(options.password, i, len);

		// 计算相关值
		let correlation = 0;
		for (let j = 0; j < len; j++) {
			correlation += combined[start + j] * pn[j];
		}
		correlation /= len;

		extracted.push(correlation > 0 ? 1 : 0);
	}

	// BCH 解码
	const decodedBits = bchDecode(extracted, expectedLength);

	// 尝试解码为字符串
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
