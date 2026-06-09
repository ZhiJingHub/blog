/**
 * URL 编解码工具 —— base64url 方案
 * 将任意 URL 映射为 URL 安全的短 slug，可逆解码。
 */

function toBase64Url(base64: string): string {
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(base64url: string): string {
	let b64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
	const pad = b64.length % 4;
	if (pad) b64 += '='.repeat(4 - pad);
	return b64;
}

/** 将 URL 编码为 base64url slug */
export function encodeUrl(url: string): string {
	// 使用 TextEncoder 处理 UTF-8 字符
	const bytes = new TextEncoder().encode(url);
	let binary = '';
	for (const b of bytes) binary += String.fromCharCode(b);
	return toBase64Url(btoa(binary));
}

/** 将 base64url slug 解码回 URL，失败返回 null */
export function decodeUrl(slug: string): string | null {
	try {
		const b64 = fromBase64Url(slug);
		const binary = atob(b64);
		const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
		return new TextDecoder().decode(bytes);
	} catch {
		return null;
	}
}
