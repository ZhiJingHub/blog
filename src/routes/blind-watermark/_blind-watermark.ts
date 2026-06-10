/**
 * 盲水印核心算法
 * 基于 DCT + QIM (量化索引调制)
 *
 * 嵌入流程：图片 → 灰度 → 8×8 分块 → DCT → QIM 嵌入 → IDCT → 输出
 * 提取流程：图片 → 灰度 → 8×8 分块 → DCT → QIM 提取 → 多数投票 → 解码
 */

import { stringToBits, bitsToString, bchEncode, bchDecode } from './_bch';

// ==================== DCT 核心 ====================

/** DCT 基矩阵缓存 */
let dctMatrix: Float64Array | null = null;
let idctMatrix: Float64Array | null = null;

function initDctMatrix(): void {
	if (dctMatrix) return;
	const N = 8;
	dctMatrix = new Float64Array(N * N);
	idctMatrix = new Float64Array(N * N);

	for (let u = 0; u < N; u++) {
		for (let x = 0; x < N; x++) {
			const cu = u === 0 ? 1 / Math.SQRT2 : 1;
			dctMatrix[u * N + x] = cu * Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N));
			idctMatrix[x * N + u] = dctMatrix[u * N + x];
		}
	}
}

/** 2D DCT（8×8 块） */
function dct2d(block: Float64Array): Float64Array {
	initDctMatrix();
	const N = 8;
	const temp = new Float64Array(64);
	const result = new Float64Array(64);

	// 行变换
	for (let u = 0; u < N; u++) {
		for (let x = 0; x < N; x++) {
			let sum = 0;
			for (let y = 0; y < N; y++) {
				sum += block[u * N + y] * dctMatrix![x * N + y];
			}
			temp[u * N + x] = sum;
		}
	}

	// 列变换
	for (let u = 0; u < N; u++) {
		for (let v = 0; v < N; v++) {
			let sum = 0;
			for (let x = 0; x < N; x++) {
				sum += temp[x * N + v] * dctMatrix![u * N + x];
			}
			result[u * N + v] = sum / 4; // 归一化
		}
	}

	return result;
}

/** 2D IDCT（8×8 块） */
function idct2d(block: Float64Array): Float64Array {
	initDctMatrix();
	const N = 8;
	const temp = new Float64Array(64);
	const result = new Float64Array(64);

	// 行变换
	for (let x = 0; x < N; x++) {
		for (let y = 0; y < N; y++) {
			let sum = 0;
			for (let u = 0; u < N; u++) {
				sum += (u === 0 ? 1 / Math.SQRT2 : 1) * block[x * N + u] * dctMatrix![u * N + y];
			}
			temp[x * N + y] = sum;
		}
	}

	// 列变换
	for (let x = 0; x < N; x++) {
		for (let y = 0; y < N; y++) {
			let sum = 0;
			for (let v = 0; v < N; v++) {
				sum += (v === 0 ? 1 / Math.SQRT2 : 1) * temp[v * N + y] * dctMatrix![v * N + x];
			}
			result[x * N + y] = sum / 4;
		}
	}

	return result;
}

// ==================== QIM 量化索引调制 ====================

/** 中频系数位置（在 8×8 块中） */
const MID_FREQ_POSITIONS = [
	[1, 2], [2, 1], [2, 2], [1, 3], [3, 1], [3, 2], [2, 3]
];

/** 密码派生伪随机序列 */
function prng(password: string, length: number): number[] {
	let hash = 0;
	for (let i = 0; i < password.length; i++) {
		hash = ((hash << 5) - hash + password.charCodeAt(i)) | 0;
	}

	const result: number[] = [];
	let seed = Math.abs(hash);
	for (let i = 0; i < length; i++) {
		seed = (seed * 1103515245 + 12345) & 0x7fffffff;
		result.push(seed);
	}
	return result;
}

/** QIM 嵌入单个比特 */
function qimEmbed(coefficient: number, bit: number, step: number, dither: number): number {
	const quantized = Math.round((coefficient - dither) / step);
	if (bit === 0) {
		return (quantized % 2 === 0 ? quantized : quantized + 1) * step + dither;
	} else {
		return (quantized % 2 === 1 ? quantized : quantized + 1) * step + dither;
	}
}

/** QIM 提取单个比特 */
function qimExtract(coefficient: number, step: number, dither: number): number {
	const quantized = Math.round((coefficient - dither) / step);
	return quantized % 2 === 0 ? 0 : 1;
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

/** 从 Canvas 提取 8×8 块 */
function extractBlocks(gray: Float64Array, width: number, height: number): { blocks: Float64Array[]; positions: [number, number][] } {
	const blocks: Float64Array[] = [];
	const positions: [number, number][] = [];

	for (let y = 0; y <= height - 8; y += 8) {
		for (let x = 0; x <= width - 8; x += 8) {
			const block = new Float64Array(64);
			for (let by = 0; by < 8; by++) {
				for (let bx = 0; bx < 8; bx++) {
					block[by * 8 + bx] = gray[(y + by) * width + (x + bx)];
				}
			}
			blocks.push(block);
			positions.push([x, y]);
		}
	}

	return { blocks, positions };
}

/** 将块写回灰度数组 */
function writeBlock(gray: Float64Array, width: number, x: number, y: number, block: Float64Array): void {
	for (let by = 0; by < 8; by++) {
		for (let bx = 0; bx < 8; bx++) {
			const val = block[by * 8 + bx];
			gray[(y + by) * width + (x + bx)] = Math.max(0, Math.min(255, val));
		}
	}
}

/** 灰度写回 ImageData */
function grayToImageData(gray: Float64Array, imageData: ImageData): void {
	const { data, width, height } = imageData;
	for (let i = 0; i < width * height; i++) {
		const val = Math.round(gray[i]);
		data[i * 4] = val;
		data[i * 4 + 1] = val;
		data[i * 4 + 2] = val;
		data[i * 4 + 3] = 255;
	}
}

// ==================== 公开 API ====================

export interface BlindWatermarkOptions {
	password: string;
	strength: number; // 嵌入强度 1-50，推荐 10-25
}

export interface BlindWatermarkResult {
	imageData: ImageData;
	embeddedBits: number;
	totalBlocks: number;
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
	const gray = toGrayscale(imageData);
	const { blocks, positions } = extractBlocks(gray, width, height);

	// 将文本编码为比特流（带 BCH 纠错）
	const payloadBits = stringToBits(text);
	const encodedBits = bchEncode(payloadBits);

	if (encodedBits.length === 0) {
		throw new Error('水印内容不能为空');
	}

	// 密码派生伪随机序列
	const randomSeq = prng(options.password, MID_FREQ_POSITIONS.length);
	const step = options.strength; // 量化步长

	// 对每个块嵌入完整的水印（冗余嵌入）
	for (let b = 0; b < blocks.length; b++) {
		const dctBlock = dct2d(blocks[b]);

		// 在中频系数中嵌入比特
		for (let i = 0; i < encodedBits.length && i < MID_FREQ_POSITIONS.length; i++) {
			const [row, col] = MID_FREQ_POSITIONS[i];
			const idx = row * 8 + col;
			const dither = (randomSeq[i] % 1000) / 1000 * step;
			dctBlock[idx] = qimEmbed(dctBlock[idx], encodedBits[i], step, dither);
		}

		const spatialBlock = idct2d(dctBlock);
		writeBlock(gray, width, positions[b][0], positions[b][1], spatialBlock);
	}

	// 写回 ImageData
	grayToImageData(gray, imageData);

	return {
		imageData,
		embeddedBits: encodedBits.length,
		totalBlocks: blocks.length
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
	const gray = toGrayscale(imageData);
	const { blocks } = extractBlocks(gray, width, height);

	if (blocks.length === 0) return null;

	const randomSeq = prng(options.password, MID_FREQ_POSITIONS.length);
	const step = options.strength;

	// 从每个块提取比特
	const allExtracted: number[][] = [];
	for (const block of blocks) {
		const dctBlock = dct2d(block);
		const bits: number[] = [];

		for (let i = 0; i < MID_FREQ_POSITIONS.length; i++) {
			const [row, col] = MID_FREQ_POSITIONS[i];
			const idx = row * 8 + col;
			const dither = (randomSeq[i] % 1000) / 1000 * step;
			bits.push(qimExtract(dctBlock[idx], step, dither));
		}

		allExtracted.push(bits);
	}

	// 多数投票
	const bitLength = allExtracted[0].length;
	const voted: number[] = [];
	for (let i = 0; i < bitLength; i++) {
		let count = 0;
		for (const extracted of allExtracted) {
			count += extracted[i];
		}
		voted.push(count >= allExtracted.length / 2 ? 1 : 0);
	}

	// BCH 解码
	const decodedBits = bchDecode(voted, expectedLength);

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

		// 转为 Blob
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
