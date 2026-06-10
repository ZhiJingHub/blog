/**
 * Haar 小波变换 (DWT) 模块
 * 用于盲水印的多分辨率分解
 *
 * 2 级 Haar DWT 将图像分解为：
 * LL2 — 低频近似（4x 缩小）
 * LH2/HL2/HH2 — 第 2 级细节
 * LH1/HL1/HH1 — 第 1 级细节
 */

/**
 * 1D Haar DWT（就地变换）
 * 输入长度必须为偶数
 */
function haar1d(data: Float64Array, length: number): void {
	const half = length >> 1;
	const temp = new Float64Array(length);

	for (let i = 0; i < half; i++) {
		const a = data[i * 2];
		const b = data[i * 2 + 1];
		temp[i] = (a + b) * 0.7071067811865476; // LL: 1/√2
		temp[i + half] = (a - b) * 0.7071067811865476; // HH: 1/√2
	}

	data.set(temp.subarray(0, length));
}

/**
 * 1D Haar IDWT（就地变换）
 */
function ihaar1d(data: Float64Array, length: number): void {
	const half = length >> 1;
	const temp = new Float64Array(length);

	for (let i = 0; i < half; i++) {
		const low = data[i];
		const high = data[i + half];
		temp[i * 2] = (low + high) * 0.7071067811865476;
		temp[i * 2 + 1] = (low - high) * 0.7071067811865476;
	}

	data.set(temp.subarray(0, length));
}

/**
 * 2D Haar DWT 分解
 * 将 width×height 的灰度图分解为 4 个子带
 * 返回 LL, LH, HL, HH 子带（各为 width/2 × height/2）
 */
export function dwt2d(
	gray: Float64Array,
	width: number,
	height: number
): { ll: Float64Array; lh: Float64Array; hl: Float64Array; hh: Float64Array; w: number; h: number } {
	const w2 = width >> 1;
	const h2 = height >> 1;

	// 先对每行做 1D DWT
	const rowTransformed = new Float64Array(width * height);
	for (let y = 0; y < height; y++) {
		const row = new Float64Array(width);
		for (let x = 0; x < width; x++) {
			row[x] = gray[y * width + x];
		}
		haar1d(row, width);
		for (let x = 0; x < width; x++) {
			rowTransformed[y * width + x] = row[x];
		}
	}

	// 再对每列做 1D DWT
	const ll = new Float64Array(w2 * h2);
	const lh = new Float64Array(w2 * h2);
	const hl = new Float64Array(w2 * h2);
	const hh = new Float64Array(w2 * h2);

	for (let x = 0; x < width; x++) {
		const col = new Float64Array(height);
		for (let y = 0; y < height; y++) {
			col[y] = rowTransformed[y * width + x];
		}
		haar1d(col, height);

		// 分拣到 4 个子带
		if (x < w2) {
			for (let y = 0; y < h2; y++) {
				ll[y * w2 + x] = col[y]; // 低行低列
				lh[y * w2 + x] = col[y + h2]; // 高行低列
			}
		} else {
			const cx = x - w2;
			for (let y = 0; y < h2; y++) {
				hl[y * w2 + cx] = col[y]; // 低行高列
				hh[y * w2 + cx] = col[y + h2]; // 高行高列
			}
		}
	}

	return { ll, lh, hl, hh, w: w2, h: h2 };
}

/**
 * 2D Haar DWT 重构
 * 从 4 个子带还原为原始灰度图
 */
export function idwt2d(
	ll: Float64Array,
	lh: Float64Array,
	hl: Float64Array,
	hh: Float64Array,
	w2: number,
	h2: number,
	width: number,
	height: number
): Float64Array {
	const reconstructed = new Float64Array(width * height);

	// 先重组列
	for (let x = 0; x < width; x++) {
		const col = new Float64Array(height);

		if (x < w2) {
			for (let y = 0; y < h2; y++) {
				col[y] = ll[y * w2 + x];
				col[y + h2] = lh[y * w2 + x];
			}
		} else {
			const cx = x - w2;
			for (let y = 0; y < h2; y++) {
				col[y] = hl[y * w2 + cx];
				col[y + h2] = hh[y * w2 + cx];
			}
		}

		ihaar1d(col, height);
		for (let y = 0; y < height; y++) {
			reconstructed[y * width + x] = col[y];
		}
	}

	// 再对每行做 IDWT
	for (let y = 0; y < height; y++) {
		const row = new Float64Array(width);
		for (let x = 0; x < width; x++) {
			row[x] = reconstructed[y * width + x];
		}
		ihaar1d(row, width);
		for (let x = 0; x < width; x++) {
			reconstructed[y * width + x] = row[x];
		}
	}

	return reconstructed;
}
