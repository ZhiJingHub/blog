/**
 * @typedef {{ type: string; children?: VisitableNode[] }} VisitableNode
 * @param {VisitableNode | VisitableNode[] | undefined | null} node
 * @param {string} type
 * @param {(node: any) => void} fn
 */
export function visit(node, type, fn) {
	if (!node || typeof node !== 'object') return;
	if (Array.isArray(node)) {
		for (const c of node) visit(c, type, fn);
		return;
	}
	if (node.type === type) fn(node);
	if (node.children) visit(node.children, type, fn);
}
