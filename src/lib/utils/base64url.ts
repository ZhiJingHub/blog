/**
 * URL 安全的 base64url 编解码（Node + 浏览器通用）
 */

export function encodeBase64Url(str: string): string {
	let binary: string;
	if (typeof Buffer !== 'undefined') {
		binary = Buffer.from(str, 'utf-8').toString('base64');
	} else {
		const bytes = new TextEncoder().encode(str);
		let bin = '';
		for (const b of bytes) bin += String.fromCharCode(b);
		binary = btoa(bin);
	}
	return binary.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeBase64Url(slug: string): string | null {
	try {
		let b64 = slug.replace(/-/g, '+').replace(/_/g, '/');
		const pad = b64.length % 4;
		if (pad) b64 += '='.repeat(4 - pad);

		if (typeof Buffer !== 'undefined') {
			return Buffer.from(b64, 'base64').toString('utf-8');
		}
		const binary = atob(b64);
		const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
		return new TextDecoder().decode(bytes);
	} catch {
		return null;
	}
}
