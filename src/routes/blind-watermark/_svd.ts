/**
 * 小矩阵 SVD 分解 (Jacobi 迭代法)
 * 针对 4×4 矩阵优化
 *
 * A = U * diag(s) * V^T
 */

/**
 * 单边 Jacobi SVD
 * 输入: m×n 矩阵 (行优先, m >= n)
 * 输出: { U: m×n, s: n, V: n×n }
 */
export function svd(
	A: Float64Array,
	m: number,
	n: number
): { U: Float64Array; s: Float64Array; V: Float64Array } {
	// 复制 A 到 B (会被修改)
	const B = new Float64Array(A);
	// V 初始化为单位矩阵
	const V = new Float64Array(n * n);
	for (let i = 0; i < n; i++) V[i * n + i] = 1;

	const maxIter = 50;
	const eps = 1e-10;

	for (let iter = 0; iter < maxIter; iter++) {
		let converged = true;

		for (let i = 0; i < n - 1; i++) {
			for (let j = i + 1; j < n; j++) {
				// 计算列 i 和列 j 的内积
				let dot_ii = 0, dot_jj = 0, dot_ij = 0;
				for (let k = 0; k < m; k++) {
					dot_ii += B[k * n + i] * B[k * n + i];
					dot_jj += B[k * n + j] * B[k * n + j];
					dot_ij += B[k * n + i] * B[k * n + j];
				}

				// 检查是否已正交
				if (Math.abs(dot_ij) < eps * Math.sqrt(dot_ii * dot_jj)) continue;
				converged = false;

				// 计算 Jacobi 旋转角度
				const tau = (dot_jj - dot_ii) / (2 * dot_ij);
				const t = Math.sign(tau) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
				const c = 1 / Math.sqrt(1 + t * t);
				const s = t * c;

				// 对 B 的列 i, j 应用 Givens 旋转
				for (let k = 0; k < m; k++) {
					const bi = B[k * n + i];
					const bj = B[k * n + j];
					B[k * n + i] = c * bi - s * bj;
					B[k * n + j] = s * bi + c * bj;
				}

				// 对 V 的列 i, j 应用同样的旋转
				for (let k = 0; k < n; k++) {
					const vi = V[k * n + i];
					const vj = V[k * n + j];
					V[k * n + i] = c * vi - s * vj;
					V[k * n + j] = s * vi + c * vj;
				}
			}
		}

		if (converged) break;
	}

	// 计算奇异值（B 的列范数）并排序
	const s = new Float64Array(n);
	const indices = new Uint32Array(n);
	for (let j = 0; j < n; j++) {
		let norm = 0;
		for (let i = 0; i < m; i++) norm += B[i * n + j] * B[i * n + j];
		s[j] = Math.sqrt(norm);
		indices[j] = j;
	}

	// 按奇异值降序排序
	for (let i = 0; i < n - 1; i++) {
		for (let j = i + 1; j < n; j++) {
			if (s[indices[i]] < s[indices[j]]) {
				const tmp = indices[i];
				indices[i] = indices[j];
				indices[j] = tmp;
			}
		}
	}

	// 重排 U, s, V
	const U = new Float64Array(m * n);
	const sSorted = new Float64Array(n);
	const VSorted = new Float64Array(n * n);

	for (let j = 0; j < n; j++) {
		const src = indices[j];
		sSorted[j] = s[src];
		for (let i = 0; i < m; i++) U[i * n + j] = B[i * n + src] / (s[src] || 1);
		for (let i = 0; i < n; i++) VSorted[i * n + j] = V[i * n + src];
	}

	return { U, s: sSorted, V: VSorted };
}
