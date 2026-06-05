export function parseQueryTerms(query: string): string[] {
	const terms: string[] = [];
	const re = /"([^"]+)"|(\S+)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(query)) !== null) {
		const t = (m[1] ?? m[2] ?? '').trim().toLowerCase();
		if (t) terms.push(t);
	}
	return terms;
}

export interface HighlightSegment {
	text: string;
	highlight: boolean;
}

export function parseHighlightedSegments(text: string, query: string): HighlightSegment[] {
	const terms = parseQueryTerms(query);
	if (terms.length === 0) return [{ text, highlight: false }];
	const escaped = terms
		.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
		.sort((a, b) => b.length - a.length);
	const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
	const segments: HighlightSegment[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = regex.exec(text)) !== null) {
		if (match.index > lastIndex) {
			segments.push({ text: text.slice(lastIndex, match.index), highlight: false });
		}
		segments.push({ text: match[0], highlight: true });
		lastIndex = regex.lastIndex;
	}
	if (lastIndex < text.length) {
		segments.push({ text: text.slice(lastIndex), highlight: false });
	}
	return segments;
}
