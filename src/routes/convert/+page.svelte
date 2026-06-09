<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Switch } from '$lib/components/ui/switch';
  import { Slider } from '$lib/components/ui/slider';
  import { Badge } from '$lib/components/ui/badge';
  import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import Icon from '@iconify/svelte';
  import type {
    ConvertOptions,
    ConvertResult,
    LoadedImage,
    OutputFormat,
    CompressionPreset,
    BatchItem
  } from './_types';
  import {
    FORMAT_OPTIONS,
    PRESET_SCALES,
    COMPRESSION_PRESETS
  } from './_types';
  import {
    loadImage,
    revokeUrl,
    formatFileSize,
    calculateCompressionRate,
    calculateDimensions,
    supportsAVIF,
    generateOutputFilename
  } from './_image-utils';
  import {
    performConversion,
    getFormatExtension,
    formatSupportsQuality,
    downloadBlob
  } from './_converter';

  // 状态
  let sourceImage = $state<LoadedImage | null>(null);
  let convertResult = $state<ConvertResult | null>(null);
  let isConverting = $state(false);
  let error = $state<string | null>(null);
  let avifSupported = $state(false);
  let isDragging = $state(false);
  let mode = $state<'single' | 'batch'>('single');

  // 批量转换状态
  let batchItems = $state<BatchItem[]>([]);
  let isBatchConverting = $state(false);

  // 转换选项
  let options = $state<ConvertOptions>({
    format: 'image/webp',
    quality: 0.85,
    maintainAspectRatio: true,
    backgroundColor: '#ffffff',
    customFilename: '',
    rotation: 0,
    flipH: false,
    flipV: false
  });

  // 尺寸输入
  let widthInput = $state<string>('');
  let heightInput = $state<string>('');

  // 可用的输出格式（过滤掉浏览器不支持的）
  let availableFormats = $derived(
    FORMAT_OPTIONS.filter(
      (f) => f.value !== 'image/avif' || avifSupported
    )
  );

  // 是否显示质量滑块
  let showQuality = $derived(formatSupportsQuality(options.format));

  // 压缩率
  let compressionRate = $derived(
    convertResult
      ? calculateCompressionRate(convertResult.originalSize, convertResult.convertedSize)
      : 0
  );

  // 检测 AVIF 支持
  onMount(async () => {
    avifSupported = await supportsAVIF();
  });

  // 处理文件上传
  async function handleFileUpload(file: File) {
    error = null;
    convertResult = null;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      error = '请上传图片文件';
      return;
    }

    // 验证文件大小（限制 50MB）
    if (file.size > 50 * 1024 * 1024) {
      error = '文件大小不能超过 50MB';
      return;
    }

    try {
      // 释放之前的资源
      if (sourceImage) {
        revokeUrl(sourceImage.url);
      }

      sourceImage = await loadImage(file);
      widthInput = sourceImage.width.toString();
      heightInput = sourceImage.height.toString();
    } catch (e) {
      error = e instanceof Error ? e.message : '加载图片失败';
    }
  }

  // 处理批量文件上传
  async function handleBatchUpload(files: FileList) {
    error = null;
    const newItems: BatchItem[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 50 * 1024 * 1024) continue;

      try {
        const loaded = await loadImage(file);
        newItems.push({
          id: crypto.randomUUID(),
          file,
          url: loaded.url,
          img: loaded.img,
          width: loaded.width,
          height: loaded.height,
          status: 'pending'
        });
      } catch (e) {
        console.error('加载图片失败:', file.name, e);
      }
    }

    batchItems = [...batchItems, ...newItems];
  }

  // 批量文件输入变化
  function handleBatchFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      handleBatchUpload(input.files);
    }
  }

  // 移除批量项目
  function removeBatchItem(id: string) {
    const item = batchItems.find((i) => i.id === id);
    if (item) {
      revokeUrl(item.url);
      if (item.result) {
        revokeUrl(item.result.url);
      }
    }
    batchItems = batchItems.filter((i) => i.id !== id);
  }

  // 清空批量列表
  function clearBatchItems() {
    batchItems.forEach((item) => {
      revokeUrl(item.url);
      if (item.result) {
        revokeUrl(item.result.url);
      }
    });
    batchItems = [];
  }

  // 批量转换
  async function handleBatchConvert() {
    if (batchItems.length === 0) return;

    isBatchConverting = true;
    error = null;

    try {
      const promises = batchItems.map(async (item) => {
        // 更新状态为转换中
        batchItems = batchItems.map((i) =>
          i.id === item.id ? { ...i, status: 'converting' as const } : i
        );

        try {
          const width = parseInt(widthInput) || undefined;
          const height = parseInt(heightInput) || undefined;

          const result = await performConversion(item.img, item.file.size, {
            ...options,
            width,
            height
          });

          // 更新状态为完成
          batchItems = batchItems.map((i) =>
            i.id === item.id ? { ...i, status: 'done' as const, result } : i
          );
        } catch (e) {
          // 更新状态为错误
          batchItems = batchItems.map((i) =>
            i.id === item.id
              ? { ...i, status: 'error' as const, error: e instanceof Error ? e.message : '转换失败' }
              : i
          );
        }
      });

      await Promise.all(promises);
    } catch (e) {
      error = e instanceof Error ? e.message : '批量转换失败';
    } finally {
      isBatchConverting = false;
    }
  }

  // 下载批量结果（打包为 zip 或逐个下载）
  function downloadBatchResults() {
    const doneItems = batchItems.filter((i) => i.status === 'done' && i.result);

    doneItems.forEach((item) => {
      if (item.result) {
        const extension = getFormatExtension(options.format);
        let filename: string;

        if (options.customFilename?.trim()) {
          filename = options.customFilename.trim();
          if (!filename.includes('.')) {
            filename += extension;
          }
          // 批量模式下添加序号
          const index = doneItems.indexOf(item) + 1;
          filename = filename.replace(/(\.[^.]+)?$/, `_${index}$1`);
        } else {
          filename = generateOutputFilename(item.file.name, extension);
        }

        downloadBlob(item.result.blob, filename);
      }
    });
  }

  // 文件输入变化
  function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }

  // 拖拽处理
  function handleDragenter(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragover(event: DragEvent) {
    event.preventDefault();
  }

  function handleDragleave(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;

    const file = event.dataTransfer?.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }

  // 宽度输入变化
  function handleWidthChange() {
    if (!sourceImage) return;

    const width = parseInt(widthInput);
    if (isNaN(width) || width <= 0) return;

    if (options.maintainAspectRatio) {
      const dims = calculateDimensions(
        { width: sourceImage.width, height: sourceImage.height },
        { width, maintainAspectRatio: true }
      );
      heightInput = dims.height.toString();
    }
  }

  // 高度输入变化
  function handleHeightChange() {
    if (!sourceImage) return;

    const height = parseInt(heightInput);
    if (isNaN(height) || height <= 0) return;

    if (options.maintainAspectRatio) {
      const dims = calculateDimensions(
        { width: sourceImage.width, height: sourceImage.height },
        { height, maintainAspectRatio: true }
      );
      widthInput = dims.width.toString();
    }
  }

  // 应用预设缩放
  function applyPresetScale(scale: number) {
    if (!sourceImage) return;

    const newWidth = Math.round(sourceImage.width * scale);
    const newHeight = Math.round(sourceImage.height * scale);

    widthInput = newWidth.toString();
    heightInput = newHeight.toString();
  }

  // 应用压缩预设
  function applyCompressionPreset(preset: CompressionPreset) {
    options.format = preset.format;
    options.quality = preset.quality;
  }

  // 旋转图片
  function rotateImage(degrees: number) {
    options.rotation = (options.rotation + degrees) % 360;
    if (options.rotation < 0) options.rotation += 360;
  }

  // 翻转图片
  function toggleFlipH() {
    options.flipH = !options.flipH;
  }

  function toggleFlipV() {
    options.flipV = !options.flipV;
  }

  // 执行转换
  async function handleConvert() {
    if (!sourceImage) return;

    isConverting = true;
    error = null;

    try {
      const width = parseInt(widthInput) || undefined;
      const height = parseInt(heightInput) || undefined;

      const result = await performConversion(sourceImage.img, sourceImage.file.size, {
        ...options,
        width,
        height
      });

      // 释放之前的结果
      if (convertResult) {
        revokeUrl(convertResult.url);
      }

      convertResult = result;
    } catch (e) {
      error = e instanceof Error ? e.message : '转换失败';
    } finally {
      isConverting = false;
    }
  }

  // 下载转换结果
  function handleDownload() {
    if (!convertResult || !sourceImage) return;

    const extension = getFormatExtension(options.format);
    let filename: string;

    if (options.customFilename?.trim()) {
      // 使用自定义文件名
      filename = options.customFilename.trim();
      // 如果没有扩展名，自动添加
      if (!filename.includes('.')) {
        filename += extension;
      }
    } else {
      // 使用原始文件名
      filename = generateOutputFilename(sourceImage.file.name, extension);
    }

    downloadBlob(convertResult.blob, filename);
  }

  // 重置
  function handleReset() {
    if (sourceImage) {
      revokeUrl(sourceImage.url);
    }
    if (convertResult) {
      revokeUrl(convertResult.url);
    }

    sourceImage = null;
    convertResult = null;
    error = null;
    widthInput = '';
    heightInput = '';
    options = {
      format: 'image/webp',
      quality: 0.85,
      maintainAspectRatio: true,
      backgroundColor: '#ffffff',
      customFilename: '',
      rotation: 0,
      flipH: false,
      flipV: false
    };
  }

  // 清理资源
  onMount(() => {
    return () => {
      // 清理单图模式资源
      if (sourceImage) {
        revokeUrl(sourceImage.url);
      }
      if (convertResult) {
        revokeUrl(convertResult.url);
      }

      // 清理批量模式资源
      batchItems.forEach((item) => {
        revokeUrl(item.url);
        if (item.result) {
          revokeUrl(item.result.url);
        }
      });
    };
  });
</script>

<svelte:head>
  <title>图片格式转换 - ZhiJing's Blog</title>
  <meta name="description" content="在线图片格式转换工具，支持 PNG、JPG、WebP、AVIF、BMP、GIF、SVG 格式相互转换，支持批量转换、旋转翻转、压缩预设" />
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-6 sm:py-8">
  <!-- 标题 -->
  <div class="mb-6">
    <a href="/" class="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
      <Icon icon="mdi:chevron-left" class="size-4" />
      返回首页
    </a>
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
          <Icon icon="mdi:image-sync" class="size-8 text-primary" />
          图片格式转换
        </h1>
        <p class="mt-2 text-muted-foreground">
          在线图片格式转换工具，支持 PNG、JPG、WebP、AVIF、BMP、GIF、SVG 格式
        </p>
      </div>
      <Tabs value={mode} onValueChange={(v: string) => (mode = v as 'single' | 'batch')}>
        <TabsList>
          <TabsTrigger value="single" class="gap-1.5">
            <Icon icon="mdi:image" class="size-4" />
            单图转换
          </TabsTrigger>
          <TabsTrigger value="batch" class="gap-1.5">
            <Icon icon="mdi:image-multiple" class="size-4" />
            批量转换
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  </div>

  <!-- 主要内容区域 -->
  <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
    <!-- 左栏：上传和预览 -->
    <div class="space-y-6">
      {#if mode === 'single'}
        <!-- 单图模式：上传区域 -->
        <Card>
          <CardContent class="p-4 sm:p-6">
            <div
              class="relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors sm:min-h-[240px] sm:p-8 {isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'}"
              ondragenter={handleDragenter}
              ondragover={handleDragover}
              ondragleave={handleDragleave}
              ondrop={handleDrop}
              onclick={() => document.getElementById('file-input')?.click()}
              onkeydown={(e) => e.key === 'Enter' && document.getElementById('file-input')?.click()}
              role="button"
              tabindex="0"
            >
              <input
                id="file-input"
                type="file"
                accept="image/*"
                class="hidden"
                onchange={handleFileChange}
              />

              {#if sourceImage}
                <div class="flex w-full flex-col items-center gap-4">
                  <!-- 原图预览 -->
                  <div class="relative w-full max-w-md">
                    <img
                      src={sourceImage.url}
                      alt="原图预览"
                      class="mx-auto max-h-[250px] rounded-lg object-contain sm:max-h-[300px]"
                    />
                    <Badge variant="secondary" class="absolute left-2 top-2">原图</Badge>
                  </div>

                  <!-- 文件信息 -->
                  <div class="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                    <span class="flex items-center gap-1">
                      <Icon icon="mdi:file-image" class="size-4" />
                      {sourceImage.file.name}
                    </span>
                    <span class="flex items-center gap-1">
                      <Icon icon="mdi:resize" class="size-4" />
                      {sourceImage.width} × {sourceImage.height}
                    </span>
                    <span class="flex items-center gap-1">
                      <Icon icon="mdi:harddisk" class="size-4" />
                      {formatFileSize(sourceImage.file.size)}
                    </span>
                  </div>
                </div>
              {:else}
                <div class="flex flex-col items-center gap-3 text-muted-foreground">
                  <Icon icon="mdi:image-plus" class="size-12" />
                  <div class="text-center">
                    <p class="text-lg font-medium">点击或拖拽上传图片</p>
                    <p class="mt-1 text-sm">支持 PNG、JPG、WebP、GIF、BMP、SVG</p>
                  </div>
                </div>
              {/if}
            </div>
          </CardContent>
        </Card>
      {:else}
        <!-- 批量模式：上传区域 -->
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="flex items-center justify-between text-base">
              <span class="flex items-center gap-2">
                <Icon icon="mdi:image-multiple" class="size-5" />
                批量上传
              </span>
              {#if batchItems.length > 0}
                <Button variant="ghost" size="sm" onclick={clearBatchItems}>
                  <Icon icon="mdi:delete-sweep" class="mr-1 size-4" />
                  清空
                </Button>
              {/if}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-0">
            <div
              class="relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors {isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'}"
              ondragenter={handleDragenter}
              ondragover={handleDragover}
              ondragleave={handleDragleave}
              ondrop={(e) => {
                e.preventDefault();
                isDragging = false;
                if (e.dataTransfer?.files.length) {
                  handleBatchUpload(e.dataTransfer.files);
                }
              }}
              onclick={() => document.getElementById('batch-file-input')?.click()}
              onkeydown={(e) => e.key === 'Enter' && document.getElementById('batch-file-input')?.click()}
              role="button"
              tabindex="0"
            >
              <input
                id="batch-file-input"
                type="file"
                accept="image/*"
                multiple
                class="hidden"
                onchange={handleBatchFileChange}
              />
              <div class="flex flex-col items-center gap-2 text-muted-foreground">
                <Icon icon="mdi:image-multiple-plus" class="size-8" />
                <p class="text-sm font-medium">点击或拖拽上传多张图片</p>
                <p class="text-xs">已添加 {batchItems.length} 张图片</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 批量图片列表 -->
        {#if batchItems.length > 0}
          <Card>
            <CardHeader class="pb-3">
              <CardTitle class="flex items-center justify-between text-base">
                <span class="flex items-center gap-2">
                  <Icon icon="mdi:format-list-bulleted" class="size-5" />
                  图片列表
                </span>
                <Badge variant="secondary">{batchItems.length} 张</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent class="pt-0">
              <div class="max-h-[400px] space-y-2 overflow-y-auto">
                {#each batchItems as item (item.id)}
                  <div class="flex items-center gap-3 rounded-lg border p-3">
                    <img
                      src={item.url}
                      alt={item.file.name}
                      class="size-12 rounded object-cover"
                    />
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium">{item.file.name}</p>
                      <p class="text-xs text-muted-foreground">
                        {item.width} × {item.height} · {formatFileSize(item.file.size)}
                      </p>
                    </div>
                    <div class="flex items-center gap-2">
                      {#if item.status === 'pending'}
                        <Badge variant="outline">等待中</Badge>
                      {:else if item.status === 'converting'}
                        <Badge variant="secondary">
                          <Icon icon="mdi:loading" class="mr-1 size-3 animate-spin" />
                          转换中
                        </Badge>
                      {:else if item.status === 'done'}
                        <Badge variant="default" class="bg-green-500">完成</Badge>
                      {:else if item.status === 'error'}
                        <Badge variant="destructive">失败</Badge>
                      {/if}
                      <Button
                        variant="ghost"
                        size="sm"
                        class="size-8 p-0"
                        onclick={() => removeBatchItem(item.id)}
                      >
                        <Icon icon="mdi:close" class="size-4" />
                      </Button>
                    </div>
                  </div>
                {/each}
              </div>
            </CardContent>
          </Card>
        {/if}
      {/if}

      <!-- 转换结果预览（单图模式） -->
      {#if mode === 'single' && convertResult}
        <Card>
          <CardContent class="p-4 sm:p-6">
            <div class="flex flex-col items-center gap-4">
              <!-- 结果预览 -->
              <div class="relative w-full max-w-md">
                <img
                  src={convertResult.url}
                  alt="转换结果"
                  class="mx-auto max-h-[250px] rounded-lg object-contain sm:max-h-[300px]"
                />
                <Badge variant="default" class="absolute left-2 top-2">转换后</Badge>
              </div>

              <!-- 文件大小对比 -->
              <div class="w-full max-w-md rounded-lg bg-muted/50 p-4">
                <div class="mb-3 flex items-center justify-between text-sm">
                  <span class="text-muted-foreground">原始大小</span>
                  <span class="font-medium">{formatFileSize(convertResult.originalSize)}</span>
                </div>
                <div class="mb-3 flex items-center justify-between text-sm">
                  <span class="text-muted-foreground">转换后大小</span>
                  <span class="font-medium">{formatFileSize(convertResult.convertedSize)}</span>
                </div>
                <div class="flex items-center justify-between border-t pt-3 text-sm">
                  <span class="text-muted-foreground">压缩率</span>
                  <span
                    class="font-medium {compressionRate > 0
                      ? 'text-green-500'
                      : compressionRate < 0
                        ? 'text-red-500'
                        : ''}"
                  >
                    {compressionRate > 0 ? '↓' : compressionRate < 0 ? '↑' : ''}{Math.abs(compressionRate)}%
                  </span>
                </div>
              </div>

              <!-- 下载按钮 -->
              <Button onclick={handleDownload} class="w-full max-w-md" size="lg">
                <Icon icon="mdi:download" class="mr-2 size-5" />
                下载转换结果
              </Button>
            </div>
          </CardContent>
        </Card>
      {/if}

      <!-- 错误提示 -->
      {#if error}
        <div class="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <div class="flex items-center gap-2">
            <Icon icon="mdi:alert-circle" class="size-5" />
            <p>{error}</p>
          </div>
        </div>
      {/if}
    </div>

    <!-- 右栏：转换设置 -->
    <div class="space-y-4">
      <!-- 格式选择 -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="flex items-center gap-2 text-base">
            <Icon icon="mdi:file-image" class="size-5" />
            输出格式
          </CardTitle>
        </CardHeader>
        <CardContent class="pt-0">
          <div class="grid grid-cols-3 gap-2">
            {#each availableFormats as format}
              {@const formatIcons: Record<string, string> = {
                'image/png': 'mdi:file-png-box',
                'image/jpeg': 'mdi:file-jpg-box',
                'image/webp': 'mdi:file-webp-box',
                'image/avif': 'mdi:file-image',
                'image/bmp': 'mdi:file-image',
                'image/gif': 'mdi:file-gif-box',
                'image/svg+xml': 'mdi:svg'
              }}
              <button
                class="flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all {options.format === format.value
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'}"
                onclick={() => (options.format = format.value)}
              >
                <Icon icon={formatIcons[format.value] || 'mdi:file-image'} class="size-5 {options.format === format.value ? 'text-primary' : 'text-muted-foreground'}" />
                <span class="text-sm font-medium">{format.label}</span>
                <span class="text-center text-xs text-muted-foreground leading-tight">{format.description}</span>
              </button>
            {/each}
          </div>

          {#if options.format === 'image/avif' && !avifSupported}
            <p class="mt-3 text-sm text-yellow-600 dark:text-yellow-400">
              <Icon icon="mdi:alert" class="mr-1 inline size-4" />
              您的浏览器可能不支持 AVIF 格式
            </p>
          {/if}
        </CardContent>
      </Card>

      <!-- 压缩预设 -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="flex items-center gap-2 text-base">
            <Icon icon="mdi:tune-variant" class="size-5" />
            快速预设
          </CardTitle>
        </CardHeader>
        <CardContent class="pt-0">
          <div class="grid grid-cols-2 gap-2">
            {#each COMPRESSION_PRESETS as preset}
              <button
                class="flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:border-primary/50 hover:bg-muted/50"
                onclick={() => applyCompressionPreset(preset)}
              >
                <div class="flex size-8 items-center justify-center rounded-md bg-primary/10">
                  <Icon icon={preset.icon} class="size-4 text-primary" />
                </div>
                <div>
                  <p class="text-sm font-medium">{preset.label}</p>
                  <p class="text-xs text-muted-foreground">{preset.description}</p>
                </div>
              </button>
            {/each}
          </div>
        </CardContent>
      </Card>

      <!-- 质量设置 -->
      {#if showQuality}
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="flex items-center justify-between text-base">
              <span class="flex items-center gap-2">
                <Icon icon="mdi:quality-high" class="size-5" />
                输出质量
              </span>
              <Badge variant="secondary">{Math.round(options.quality * 100)}%</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-0">
            <div class="space-y-2">
              <Slider
                type="single"
                value={options.quality}
                onValueChange={(v: number) => (options.quality = v)}
                min={0.1}
                max={1}
                step={0.05}
              />
              <div class="flex justify-between text-xs text-muted-foreground">
                <span>小文件</span>
                <span>高质量</span>
              </div>
            </div>
          </CardContent>
        </Card>
      {/if}

      <!-- 尺寸调整 -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="flex items-center justify-between text-base">
            <span class="flex items-center gap-2">
              <Icon icon="mdi:resize" class="size-5" />
              尺寸调整
            </span>
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground">锁定比例</span>
              <Switch bind:checked={options.maintainAspectRatio} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent class="pt-0">
          <div class="space-y-4">
            <!-- 宽高输入 -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="width-input" class="mb-1 block text-xs text-muted-foreground">宽度 (px)</label>
                <Input
                  id="width-input"
                  type="number"
                  bind:value={widthInput}
                  placeholder="宽度"
                  min="1"
                  onchange={handleWidthChange}
                />
              </div>
              <div>
                <label for="height-input" class="mb-1 block text-xs text-muted-foreground">高度 (px)</label>
                <Input
                  id="height-input"
                  type="number"
                  bind:value={heightInput}
                  placeholder="高度"
                  min="1"
                  onchange={handleHeightChange}
                />
              </div>
            </div>

            <!-- 预设缩放 -->
            <div>
              <p class="mb-2 text-xs text-muted-foreground">快速缩放</p>
              <div class="flex flex-wrap gap-1.5">
                {#each PRESET_SCALES as preset}
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-7 gap-1 px-2 text-xs"
                    onclick={() => applyPresetScale(preset.value)}
                    disabled={!sourceImage}
                  >
                    {#if preset.value < 1}
                      <Icon icon="mdi:image-size-select-small" class="size-3" />
                    {:else if preset.value === 1}
                      <Icon icon="mdi:image-size-select-actual" class="size-3" />
                    {:else}
                      <Icon icon="mdi:image-size-select-large" class="size-3" />
                    {/if}
                    {preset.label}
                  </Button>
                {/each}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 旋转/翻转 -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="flex items-center gap-2 text-base">
            <Icon icon="mdi:rotate-3d" class="size-5" />
            旋转/翻转
          </CardTitle>
        </CardHeader>
        <CardContent class="pt-0">
          <div class="space-y-3">
            <!-- 旋转按钮 -->
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                class="flex-1"
                onclick={() => rotateImage(-90)}
                disabled={!sourceImage}
              >
                <Icon icon="mdi:rotate-left" class="mr-1 size-4" />
                左转 90°
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="flex-1"
                onclick={() => rotateImage(90)}
                disabled={!sourceImage}
              >
                <Icon icon="mdi:rotate-right" class="mr-1 size-4" />
                右转 90°
              </Button>
            </div>

            <!-- 翻转按钮 -->
            <div class="flex items-center gap-2">
              <Button
                variant={options.flipH ? 'default' : 'outline'}
                size="sm"
                class="flex-1"
                onclick={toggleFlipH}
                disabled={!sourceImage}
              >
                <Icon icon="mdi:flip-horizontal" class="mr-1 size-4" />
                水平翻转
              </Button>
              <Button
                variant={options.flipV ? 'default' : 'outline'}
                size="sm"
                class="flex-1"
                onclick={toggleFlipV}
                disabled={!sourceImage}
              >
                <Icon icon="mdi:flip-vertical" class="mr-1 size-4" />
                垂直翻转
              </Button>
            </div>

            <!-- 当前状态 -->
            {#if options.rotation !== 0 || options.flipH || options.flipV}
              <div class="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon icon="mdi:information" class="size-3" />
                <span>
                  {#if options.rotation !== 0}
                    旋转 {options.rotation}°
                  {/if}
                  {#if options.flipH}
                    水平翻转
                  {/if}
                  {#if options.flipV}
                    垂直翻转
                  {/if}
                </span>
              </div>
            {/if}
          </div>
        </CardContent>
      </Card>

      <!-- 高级选项 -->
      {#if options.format === 'image/jpeg'}
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="flex items-center gap-2 text-base">
              <Icon icon="mdi:cog" class="size-5" />
              高级选项
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-0">
            <div>
              <label for="bg-color-input" class="mb-1 block text-xs text-muted-foreground">背景颜色</label>
              <div class="flex items-center gap-2">
                <input
                  type="color"
                  bind:value={options.backgroundColor}
                  class="size-9 cursor-pointer rounded border"
                />
                <Input
                  id="bg-color-input"
                  type="text"
                  bind:value={options.backgroundColor}
                  placeholder="#ffffff"
                  class="flex-1"
                />
              </div>
              <p class="mt-1.5 text-xs text-muted-foreground">
                透明图片转 JPG 时的填充颜色
              </p>
            </div>
          </CardContent>
        </Card>
      {/if}

      <!-- 自定义文件名 -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="flex items-center gap-2 text-base">
            <Icon icon="mdi:file-edit" class="size-5" />
            输出文件名
          </CardTitle>
        </CardHeader>
        <CardContent class="pt-0">
          <div class="space-y-2">
            <Input
              id="custom-filename"
              type="text"
              bind:value={options.customFilename}
              placeholder="留空则使用原文件名"
              class="w-full"
            />
            <p class="text-xs text-muted-foreground">
              {#if options.customFilename?.trim()}
                将保存为: <span class="font-medium">{options.customFilename.trim()}{options.customFilename.includes('.') ? '' : getFormatExtension(options.format)}</span>
              {:else}
                留空将自动使用原文件名
              {/if}
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- 操作按钮 -->
      <div class="space-y-3">
        {#if mode === 'single'}
          <!-- 单图模式按钮 -->
          <Button
            class="w-full"
            size="lg"
            onclick={handleConvert}
            disabled={!sourceImage || isConverting}
          >
            {#if isConverting}
              <Icon icon="mdi:loading" class="mr-2 size-5 animate-spin" />
              转换中...
            {:else}
              <Icon icon="mdi:swap-horizontal" class="mr-2 size-5" />
              开始转换
            {/if}
          </Button>

          <Button
            variant="outline"
            class="w-full"
            onclick={handleReset}
          >
            <Icon icon="mdi:refresh" class="mr-2 size-4" />
            重置
          </Button>
        {:else}
          <!-- 批量模式按钮 -->
          <Button
            class="w-full"
            size="lg"
            onclick={handleBatchConvert}
            disabled={batchItems.length === 0 || isBatchConverting}
          >
            {#if isBatchConverting}
              <Icon icon="mdi:loading" class="mr-2 size-5 animate-spin" />
              批量转换中...
            {:else}
              <Icon icon="mdi:swap-horizontal" class="mr-2 size-5" />
              批量转换 ({batchItems.length} 张)
            {/if}
          </Button>

          {#if batchItems.some((i) => i.status === 'done')}
            <Button
              variant="default"
              class="w-full bg-green-600 hover:bg-green-700"
              onclick={downloadBatchResults}
            >
              <Icon icon="mdi:download-multiple" class="mr-2 size-5" />
              下载全部结果
            </Button>
          {/if}

          <Button
            variant="outline"
            class="w-full"
            onclick={clearBatchItems}
            disabled={batchItems.length === 0}
          >
            <Icon icon="mdi:delete-sweep" class="mr-2 size-4" />
            清空列表
          </Button>
        {/if}
      </div>
    </div>
  </div>
</div>
