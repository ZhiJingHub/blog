<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Slider } from '$lib/components/ui/slider';
	import Icon from '@iconify/svelte';
	import { resolve } from '$app/paths';
	import { siteConfig } from '$lib/config/site';
	import { embedBlindWatermark, extractBlindWatermark, batchEmbed } from './_blind-watermark';

	type Mode = 'embed' | 'extract';

	let mode = $state<Mode>('embed');
	let password = $state('');
	let watermarkText = $state('');
	let strength = $state(12);
	let isProcessing = $state(false);
	let error = $state('');
	let resultMessage = $state('');
	let extractedText = $state('');
	let isDragging = $state(false);

	// 单图模式
	let sourceFile = $state<File | null>(null);
	let sourceImageUrl = $state<string | null>(null);
	let resultImageUrl = $state<string | null>(null);
	let resultBlob = $state<Blob | null>(null);
	let resultPsnr = $state<number | null>(null);

	// 批量模式
	let isBatch = $state(false);
	let batchFiles = $state<File[]>([]);
	let batchResults = $state<{ name: string; text: string | null }[]>([]);
	let batchProgress = $state(0);
	let batchTotal = $state(0);

	function handleDragenter(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragover(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragleave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const files = e.dataTransfer?.files;
		if (files) handleFiles(Array.from(files));
	}

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) handleFiles(Array.from(input.files));
	}

	function handleFiles(files: File[]) {
		const imageFiles = files.filter((f) => f.type.startsWith('image/'));
		if (imageFiles.length === 0) {
			error = '请选择图片文件';
			return;
		}
		error = '';

		if (isBatch) {
			batchFiles = imageFiles;
			batchResults = [];
		} else {
			sourceFile = imageFiles[0];
			if (sourceImageUrl) URL.revokeObjectURL(sourceImageUrl);
			sourceImageUrl = URL.createObjectURL(imageFiles[0]);
			resultImageUrl = null;
			resultBlob = null;
		}
	}

	function loadImageData(file: File): Promise<ImageData> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = img.naturalWidth;
				canvas.height = img.naturalHeight;
				const ctx = canvas.getContext('2d')!;
				ctx.drawImage(img, 0, 0);
				resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
				URL.revokeObjectURL(img.src);
			};
			img.onerror = () => reject(new Error('图片加载失败'));
			img.src = URL.createObjectURL(file);
		});
	}

	function downloadBlob(blob: Blob, filename: string) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	async function handleEmbed() {
		if (!password) { error = '请输入密码'; return; }
		if (!watermarkText) { error = '请输入水印内容'; return; }
		error = '';
		isProcessing = true;

		try {
			if (isBatch) {
				if (batchFiles.length === 0) { error = '请先上传图片'; return; }
				batchTotal = batchFiles.length;
				batchProgress = 0;
				batchResults = [];

				const images: { file: File; imageData: ImageData }[] = [];
				for (const file of batchFiles) {
					images.push({ file, imageData: await loadImageData(file) });
				}

				const results = await batchEmbed(images, watermarkText, { password, strength }, (c, t) => {
					batchProgress = c;
					batchTotal = t;
				});

				for (const { file, blob } of results) {
					downloadBlob(blob, `wm_${file.name}`);
				}
				resultMessage = `批量嵌入完成：${results.length} 张图片`;
			} else {
				if (!sourceFile) { error = '请先上传图片'; return; }
				const imageData = await loadImageData(sourceFile);
				const result = embedBlindWatermark(imageData, watermarkText, { password, strength });

				const canvas = document.createElement('canvas');
				canvas.width = result.imageData.width;
				canvas.height = result.imageData.height;
				const ctx = canvas.getContext('2d')!;
				ctx.putImageData(result.imageData, 0, 0);

				if (resultImageUrl) URL.revokeObjectURL(resultImageUrl);
				resultImageUrl = canvas.toDataURL('image/png');

				resultBlob = await new Promise<Blob>((resolve, reject) => {
					canvas.toBlob((b) => b ? resolve(b) : reject(new Error('导出失败')), 'image/png');
				});

				resultPsnr = result.psnr;
				resultMessage = `嵌入成功：${watermarkText.length} 字符，PSNR ${result.psnr.toFixed(1)}dB`;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : '处理失败';
		} finally {
			isProcessing = false;
		}
	}

	async function handleExtract() {
		if (!password) { error = '请输入密码'; return; }
		error = '';
		isProcessing = true;
		extractedText = '';

		try {
			if (isBatch) {
				if (batchFiles.length === 0) { error = '请先上传图片'; return; }
				batchTotal = batchFiles.length;
				batchProgress = 0;
				batchResults = [];

				for (let i = 0; i < batchFiles.length; i++) {
					const imageData = await loadImageData(batchFiles[i]);
					const text = extractBlindWatermark(imageData, { password, strength });
					batchResults.push({ name: batchFiles[i].name, text });
					batchProgress = i + 1;
				}

				resultMessage = `批量提取完成：${batchResults.filter((r) => r.text).length}/${batchResults.length} 成功`;
			} else {
				if (!sourceFile) { error = '请先上传图片'; return; }
				const imageData = await loadImageData(sourceFile);
				const text = extractBlindWatermark(imageData, { password, strength });

				if (text) {
					extractedText = text;
					resultMessage = '提取成功';
				} else {
					error = '未检测到水印或密码错误';
				}
			}
		} catch (e) {
			error = e instanceof Error ? e.message : '处理失败';
		} finally {
			isProcessing = false;
		}
	}

	function handleExport() {
		if (resultBlob && sourceFile) {
			downloadBlob(resultBlob, `wm_${sourceFile.name}`);
		}
	}

	function handleReset() {
		if (sourceImageUrl) URL.revokeObjectURL(sourceImageUrl);
		if (resultImageUrl && resultImageUrl.startsWith('blob:')) URL.revokeObjectURL(resultImageUrl);
		sourceFile = null;
		sourceImageUrl = null;
		resultImageUrl = null;
		resultBlob = null;
		resultPsnr = null;
		batchFiles = [];
		batchResults = [];
		error = '';
		resultMessage = '';
		extractedText = '';
		batchProgress = 0;
	}
</script>

<svelte:head>
	<title>盲水印 - {siteConfig.title}</title>
	<meta name="description" content="基于小波变换的不可见数字水印，支持嵌入和提取" />
</svelte:head>

<div class="min-h-screen bg-background">
	<div class="container mx-auto max-w-7xl px-4 pt-6 pb-12 sm:pt-8">
		<div class="mb-6">
			<a href={resolve('/')} class="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
				<Icon icon="mdi:chevron-left" class="size-4" />
				返回首页
			</a>
		</div>

		<div class="bw-layout">
			<!-- 标题 -->
			<div class="bw-title-col">
				<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">盲水印</h1>
				<p class="mt-2 text-sm text-muted-foreground">
					基于小波变换 + 扩频技术的不可见数字水印，支持嵌入、提取和批量处理
				</p>
			</div>

			<!-- 预览区域 -->
			<div class="bw-preview-col">
				<!-- 模式切换 + 批量开关 -->
				<div class="flex items-center gap-4">
					<div class="inline-flex rounded-lg border bg-muted/50 p-0.5">
						<button
							class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {mode === 'embed' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
							onclick={() => { mode = 'embed'; handleReset(); }}
						>
							<Icon icon="mdi:eye-off" class="size-4" />
							嵌入水印
						</button>
						<button
							class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {mode === 'extract' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
							onclick={() => { mode = 'extract'; handleReset(); }}
						>
							<Icon icon="mdi:magnify" class="size-4" />
							提取水印
						</button>
					</div>
					<label class="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
						<input type="checkbox" bind:checked={isBatch} class="rounded" onchange={() => handleReset()} />
						批量模式
					</label>
				</div>

				<!-- 上传区域 -->
				<div
					class="upload-area {isDragging ? 'dragging' : ''} {(sourceImageUrl || (isBatch && batchFiles.length > 0)) ? 'has-image' : ''}"
					role="button"
					tabindex="0"
					ondragenter={handleDragenter}
					ondragover={handleDragover}
					ondragleave={handleDragleave}
					ondrop={handleDrop}
					onclick={() => document.getElementById('file-input')?.click()}
					onkeydown={(e) => e.key === 'Enter' && document.getElementById('file-input')?.click()}
				>
					<input id="file-input" type="file" accept="image/*" multiple={isBatch} class="hidden" onchange={handleFileInput} />

					{#if isBatch && batchFiles.length > 0}
						<div class="w-full space-y-3">
							<p class="text-sm text-muted-foreground">已选择 {batchFiles.length} 张图片</p>
							<div class="grid grid-cols-4 gap-2">
								{#each batchFiles.slice(0, 8) as file (file.name)}
									<div class="truncate rounded bg-muted px-2 py-1 text-xs">{file.name}</div>
								{/each}
								{#if batchFiles.length > 8}
									<div class="flex items-center text-xs text-muted-foreground">+{batchFiles.length - 8} 更多</div>
								{/if}
							</div>
							<Button variant="outline" size="sm" onclick={(e) => { e.stopPropagation(); handleReset(); }}>
								<Icon icon="mdi:refresh" class="mr-1 size-4" />
								重新选择
							</Button>
						</div>
					{:else if sourceImageUrl}
						<img src={sourceImageUrl} alt="原图" class="max-h-[400px] rounded-lg object-contain" />
					{:else}
						<Icon icon={isBatch ? 'mdi:image-multiple' : 'mdi:image-plus'} class="mb-3 size-12 text-muted-foreground/40" />
						<p class="text-sm text-muted-foreground">
							{isBatch ? '拖放多张图片到此处，或点击选择' : '拖放图片到此处，或点击选择'}
						</p>
						<p class="mt-1 text-xs text-muted-foreground">支持 PNG、JPEG、WebP 等格式</p>
					{/if}
				</div>

				<!-- 操作按钮 -->
				<div class="flex flex-wrap gap-2">
					{#if mode === 'embed'}
						<Button onclick={handleEmbed} disabled={isProcessing || !password || !watermarkText || (!sourceFile && batchFiles.length === 0)}>
							<Icon icon="mdi:eye-off" class="mr-1 size-4" />
							{isBatch ? '批量嵌入' : '嵌入水印'}
						</Button>
					{:else}
						<Button onclick={handleExtract} disabled={isProcessing || !password || (!sourceFile && batchFiles.length === 0)}>
							<Icon icon="mdi:magnify" class="mr-1 size-4" />
							{isBatch ? '批量提取' : '提取水印'}
						</Button>
					{/if}

					{#if !isBatch && resultBlob}
						<Button variant="outline" onclick={handleExport}>
							<Icon icon="mdi:download" class="mr-1 size-4" />
							下载结果
						</Button>
					{/if}

					<Button variant="outline" onclick={handleReset}>
						<Icon icon="mdi:refresh" class="mr-1 size-4" />
						重置
					</Button>
				</div>

				<!-- 结果区域 -->
				{#if mode === 'embed'}
					{#if !isBatch && resultImageUrl}
						<div class="space-y-3">
							<h3 class="text-sm font-medium">水印结果</h3>
							<img src={resultImageUrl} alt="水印结果" class="max-h-[400px] rounded-lg object-contain" />
							<p class="text-xs text-muted-foreground">{resultPsnr !== null ? `PSNR ${resultPsnr.toFixed(1)}dB — ` : ''}肉眼不可察觉。请下载保存。</p>
						</div>
					{/if}
				{:else}
					{#if extractedText}
						<div class="rounded-xl border bg-muted/30 p-4">
							<h3 class="mb-2 text-sm font-medium">提取结果</h3>
							<p class="break-all rounded bg-background p-3 text-sm">{extractedText}</p>
							<Button variant="ghost" size="sm" class="mt-2" onclick={() => navigator.clipboard.writeText(extractedText)}>
								<Icon icon="mdi:content-copy" class="mr-1 size-4" />
								复制
							</Button>
						</div>
					{/if}

					{#if isBatch && batchResults.length > 0}
						<div class="space-y-2">
							<h3 class="text-sm font-medium">批量提取结果</h3>
							{#each batchResults as result (result.name)}
								<div class="flex items-center gap-3 rounded-lg border p-3">
									<span class="min-w-0 flex-1 truncate text-sm">{result.name}</span>
									{#if result.text}
										<span class="shrink-0 rounded bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">{result.text}</span>
									{:else}
										<span class="shrink-0 rounded bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400">未检测到</span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				{/if}

				<!-- 状态消息 -->
				{#if error}
					<div class="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
						<Icon icon="mdi:alert-circle" class="size-4 shrink-0" />
						{error}
					</div>
				{/if}

				{#if resultMessage}
					<div class="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
						<Icon icon="mdi:check-circle" class="size-4 shrink-0" />
						{resultMessage}
					</div>
				{/if}

				{#if isProcessing}
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<Icon icon="mdi:loading" class="size-4 animate-spin" />
						处理中{isBatch ? ` (${batchProgress}/${batchTotal})` : ''}...
					</div>
				{/if}
			</div>

			<!-- 设置面板 -->
			<div class="bw-settings-col">
				<div class="settings-card">
					<h3 class="settings-title">
						<Icon icon="mdi:cog-outline" class="size-4" />
						参数设置
					</h3>

					<div>
						<label for="bw-password" class="mb-1 block text-xs text-muted-foreground">密码</label>
						<Input id="bw-password" type="password" bind:value={password} placeholder="输入密码用于加解密" />
						<p class="mt-1 text-xs text-muted-foreground">嵌入和提取必须使用相同密码</p>
					</div>

					{#if mode === 'embed'}
						<div>
							<label for="bw-text" class="mb-1 block text-xs text-muted-foreground">水印内容</label>
							<Input id="bw-text" type="text" bind:value={watermarkText} placeholder="输入要隐藏的文本" maxlength={32} />
							<p class="mt-1 text-xs text-muted-foreground">建议不超过 32 字符，越短越抗攻击</p>
						</div>
					{/if}

					<div>
						<div class="flex items-center justify-between">
							<span class="text-xs text-muted-foreground">嵌入强度</span>
							<span class="text-xs text-muted-foreground">{strength}</span>
						</div>
						<Slider type="single" bind:value={strength} min={3} max={30} step={1} />
						<p class="mt-1 text-xs text-muted-foreground">推荐 8-15，值越大越抗攻击</p>
					</div>
				</div>

				<!-- 说明卡片 -->
				<div class="settings-card">
					<h3 class="settings-title">
						<Icon icon="mdi:information-outline" class="size-4" />
						关于盲水印
					</h3>
					<div class="space-y-2 text-xs text-muted-foreground">
						<p>盲水印是一种<strong>不可见</strong>的数字水印，嵌入后肉眼无法察觉。</p>
						<p><strong>技术原理：</strong>Haar 小波变换 + 扩频嵌入 + BCH 纠错编码</p>
						<p><strong>抗攻击能力：</strong></p>
						<ul class="ml-4 list-disc space-y-1">
							<li>JPEG 压缩（质量 50+）✓</li>
							<li>缩放（±30%）✓</li>
							<li>裁剪（保留 50%+）✓</li>
							<li>亮度/对比度调整 ✓</li>
						</ul>
						<p><strong>注意事项：</strong></p>
						<ul class="ml-4 list-disc space-y-1">
							<li>嵌入和提取必须使用相同密码和强度</li>
							<li>图片会保存为 PNG 格式以保持精度</li>
							<li>建议使用原图而非已压缩的图片</li>
						</ul>
					</div>
				</div>

				<div class="scroll-indicator"></div>
			</div>
		</div>
	</div>
</div>

<style>
	.bw-layout {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.bw-title-col {
		display: block;
	}
	.bw-preview-col {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		min-width: 0;
	}
	.bw-settings-col {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		min-width: 0;
		position: relative;
	}
	.scroll-indicator { display: none; }

	.upload-area {
		display: flex;
		min-height: 200px;
		cursor: pointer;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 0.75rem;
		border: 2px dashed;
		padding: 2rem;
		transition: all 0.2s;
		border-color: var(--muted-foreground) / 25%;
		background: var(--card);
	}
	.upload-area:hover { border-color: var(--primary) / 50%; }
	.upload-area.dragging { border-color: var(--primary); background: var(--primary) / 5%; }
	.upload-area.has-image { border-style: solid; border-color: var(--border); }

	.settings-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		border-radius: 0.75rem;
		border: 1px solid var(--border);
		background: var(--card);
		padding: 1rem;
	}
	.settings-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	@media (min-width: 1024px) {
		.bw-layout {
			display: grid;
			grid-template-columns: 1fr 400px;
			grid-template-rows: auto 1fr;
			gap: 1.5rem;
		}
		.bw-title-col {
			grid-column: 1 / 2;
			grid-row: 1;
		}
		.bw-preview-col {
			grid-column: 1 / 2;
			grid-row: 2;
			position: sticky;
			top: 1rem;
			align-self: start;
		}
		.bw-settings-col {
			grid-column: 2 / 3;
			grid-row: 1 / -1;
			max-height: calc(100vh - 3rem);
			overflow-y: auto;
			padding-right: 0.25rem;
		}
		.scroll-indicator {
			display: block;
			position: sticky;
			bottom: 0;
			left: 0;
			right: 0;
			height: 3rem;
			background: linear-gradient(to top, var(--background), transparent);
			pointer-events: none;
		}
	}
	@media (min-width: 1280px) {
		.bw-layout {
			grid-template-columns: 1fr 460px;
		}
	}

	/* 薄滚动条 */
	.bw-settings-col::-webkit-scrollbar { width: 4px; }
	.bw-settings-col::-webkit-scrollbar-track { background: transparent; }
	.bw-settings-col::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
	.bw-settings-col::-webkit-scrollbar-thumb:hover { background: var(--muted-foreground); }
</style>
