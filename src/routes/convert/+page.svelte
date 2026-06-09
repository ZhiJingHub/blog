<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Switch } from '$lib/components/ui/switch';
  import { Slider } from '$lib/components/ui/slider';
  import { Badge } from '$lib/components/ui/badge';
  import Icon from '@iconify/svelte';
  import type {
    ConvertOptions,
    ConvertResult,
    LoadedImage,
    OutputFormat
  } from './_types';
  import { FORMAT_OPTIONS, PRESET_SCALES } from './_types';
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

  // 转换选项
  let options = $state<ConvertOptions>({
    format: 'image/webp',
    quality: 0.85,
    maintainAspectRatio: true,
    backgroundColor: '#ffffff',
    customFilename: ''
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
      customFilename: ''
    };
  }

  // 清理资源
  onMount(() => {
    return () => {
      if (sourceImage) {
        revokeUrl(sourceImage.url);
      }
      if (convertResult) {
        revokeUrl(convertResult.url);
      }
    };
  });
</script>

<svelte:head>
  <title>图片格式转换 - ZhiJing's Blog</title>
  <meta name="description" content="在线图片格式转换工具，支持 PNG、JPG、WebP、AVIF、BMP、GIF 等格式相互转换" />
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-6 sm:py-8">
  <!-- 标题 -->
  <div class="mb-6">
    <a href="/" class="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
      <Icon icon="mdi:chevron-left" class="size-4" />
      返回首页
    </a>
    <h1 class="text-2xl font-bold sm:text-3xl">图片格式转换</h1>
    <p class="mt-2 text-muted-foreground">
      在线图片格式转换工具，支持 PNG、JPG、WebP、AVIF、BMP、GIF 格式相互转换
    </p>
  </div>

  <!-- 主要内容区域 -->
  <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
    <!-- 左栏：上传和预览 -->
    <div class="space-y-6">
      <!-- 上传区域 -->
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

      <!-- 转换结果预览 -->
      {#if convertResult}
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
              <button
                class="flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all {options.format === format.value
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'}"
                onclick={() => (options.format = format.value)}
              >
                <span class="text-sm font-medium">{format.label}</span>
                <span class="text-xs text-muted-foreground">{format.description}</span>
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
                    class="h-7 px-2 text-xs"
                    onclick={() => applyPresetScale(preset.value)}
                    disabled={!sourceImage}
                  >
                    {preset.label}
                  </Button>
                {/each}
              </div>
            </div>
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
      </div>
    </div>
  </div>
</div>
