/**
 * 纠错编码：Hamming(7,4) + 3x 重复码
 * 用于盲水印的前向纠错
 */

/**
 * 将字节数组编码为比特流
 */
export function bytesToBits(bytes: Uint8Array): number[] {
	const bits: number[] = [];
	for (const byte of bytes) {
		for (let i = 7; i >= 0; i--) {
			bits.push((byte >> i) & 1);
		}
	}
	return bits;
}

/**
 * 将比特流解码为字节数组
 */
export function bitsToBytes(bits: number[]): Uint8Array {
	const bytes = new Uint8Array(Math.ceil(bits.length / 8));
	for (let i = 0; i < bits.length; i++) {
		if (bits[i]) {
			bytes[Math.floor(i / 8)] |= 1 << (7 - (i % 8));
		}
	}
	return bytes;
}

/**
 * 简化版 BCH 编码：将输入比特流重复嵌入 + 简单汉明码保护
 * 对于浏览器实现，使用轻量级方案
 */
export function bchEncode(payloadBits: number[]): number[] {
	// 策略：将每个比特重复 3 次（多数投票解码）
	// 加上每 4 位添加 3 位校验（汉明码）
	const encoded: number[] = [];

	// 分组为 4 位一组，编码为 7 位汉明码
	for (let i = 0; i < payloadBits.length; i += 4) {
		const d = [
			payloadBits[i] || 0,
			payloadBits[i + 1] || 0,
			payloadBits[i + 2] || 0,
			payloadBits[i + 3] || 0
		];

		// 汉明(7,4)编码
		const p0 = d[0] ^ d[1] ^ d[3];
		const p1 = d[0] ^ d[2] ^ d[3];
		const p2 = d[1] ^ d[2] ^ d[3];

		encoded.push(p0, p1, d[0], p2, d[1], d[2], d[3]);
	}

	// 再重复 3 次增强鲁棒性
	const result: number[] = [];
	for (const bit of encoded) {
		result.push(bit, bit, bit);
	}

	return result;
}

/**
 * BCH 解码：多数投票 + 汉明码纠错
 */
export function bchDecode(encodedBits: number[], originalLength: number): number[] {
	// 第一步：多数投票（每 3 位一组）
	const hammingBits: number[] = [];
	for (let i = 0; i < encodedBits.length; i += 3) {
		const a = encodedBits[i] || 0;
		const b = encodedBits[i + 1] || 0;
		const c = encodedBits[i + 2] || 0;
		hammingBits.push(a + b + c >= 2 ? 1 : 0);
	}

	// 第二步：汉明(7,4)解码
	const decoded: number[] = [];
	for (let i = 0; i < hammingBits.length; i += 7) {
		if (i + 6 >= hammingBits.length) break;

		const received = hammingBits.slice(i, i + 7);

		// 计算校验子
		const s1 = received[0] ^ received[2] ^ received[4] ^ received[6];
		const s2 = received[1] ^ received[2] ^ received[5] ^ received[6];
		const s3 = received[3] ^ received[4] ^ received[5] ^ received[6];

		const errorPos = s1 * 1 + s2 * 2 + s3 * 4;

		// 纠正错误
		if (errorPos > 0 && errorPos <= 7) {
			received[errorPos - 1] ^= 1;
		}

		decoded.push(received[2], received[4], received[5], received[6]);
	}

	return decoded.slice(0, originalLength);
}

/**
 * 将字符串编码为比特流（UTF-8）
 */
export function stringToBits(str: string): number[] {
	const encoder = new TextEncoder();
	const bytes = encoder.encode(str);
	// 添加长度前缀（2字节）
	const lengthBytes = new Uint8Array(2);
	lengthBytes[0] = (bytes.length >> 8) & 0xff;
	lengthBytes[1] = bytes.length & 0xff;
	const combined = new Uint8Array(2 + bytes.length);
	combined.set(lengthBytes);
	combined.set(bytes, 2);
	return bytesToBits(combined);
}

/**
 * 将比特流解码为字符串
 */
export function bitsToString(bits: number[]): string | null {
	try {
		const bytes = bitsToBytes(bits);
		if (bytes.length < 2) return null;
		const length = (bytes[0] << 8) | bytes[1];
		if (length <= 0 || length > bytes.length - 2) return null;
		const decoder = new TextDecoder();
		return decoder.decode(bytes.slice(2, 2 + length));
	} catch {
		return null;
	}
}
