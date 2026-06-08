<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Switch } from '$lib/components/ui/switch';
  import { Slider } from '$lib/components/ui/slider';
  import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
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
    backgroundColor: '#ffffff'
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
    const filename = generateOutputFilename(sourceImage.file.name, extension);
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
      backgroundColor: '#ffffff'
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
  <meta name="description" content="在线图片格式转换工具，支持 PNG、JPG、WebP、AVIF 等格式相互转换" />
</svelte:head>

<div class="container mx-auto max-w-6xl px-4 py-8">
  <!-- 标题 -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold">图片格式转换</h1>
    <p class="mt-2 text-muted-foreground">
      在线图片格式转换工具，支持 PNG、JPG、WebP、AVIF 等格式相互转换
    </p>
  </div>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
    <!-- 左栏：上传和预览 -->
    <div class="space-y-6">
      <!-- 上传区域 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Icon icon="mdi:upload" class="size-5" />
            上传图片
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            class="relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors {isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'}"
            ondragenter={handleDragenter}
            ondragover={handleDragover}
            ondragleave={handleDragleave}
            ondrop={handleDrop}
            onclick={() => document.getElementById('file-input')?.click()}
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
              <div class="flex flex-col items-center gap-4">
                <img
                  src={sourceImage.url}
                  alt="原图预览"
                  class="max-h-[300px] rounded-lg object-contain"
                />
                <div class="text-center text-sm text-muted-foreground">
                  <p>{sourceImage.file.name}</p>
                  <p>{sourceImage.width} × {sourceImage.height} 像素</p>
                  <p>{formatFileSize(sourceImage.file.size)}</p>
                </div>
              </div>
            {:else}
              <div class="flex flex-col items-center gap-2 text-muted-foreground">
                <Icon icon="mdi:image-plus" class="size-12" />
                <p class="text-lg font-medium">点击或拖拽上传图片</p>
                <p class="text-sm">支持 PNG、JPG、WebP、GIF、BMP、SVG 格式</p>
              </div>
            {/if}
          </div>
        </CardContent>
      </Card>

      <!-- 转换结果 -->
      {#if convertResult}
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Icon icon="mdi:image-check" class="size-5" />
              转换结果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="flex flex-col items-center gap-4">
              <img
                src={convertResult.url}
                alt="转换结果"
                class="max-h-[300px] rounded-lg object-contain"
              />

              <!-- 文件信息对比 -->
              <div class="grid w-full grid-cols-3 gap-4 text-center">
                <div>
                  <p class="text-sm text-muted-foreground">原始大小</p>
                  <p class="text-lg font-medium">
                    {formatFileSize(convertResult.originalSize)}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-muted-foreground">转换后大小</p>
                  <p class="text-lg font-medium">
                    {formatFileSize(convertResult.convertedSize)}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-muted-foreground">压缩率</p>
                  <p
                    class="text-lg font-medium {compressionRate > 0
                      ? 'text-green-500'
                      : compressionRate < 0
                        ? 'text-red-500'
                        : ''}"
                  >
                    {compressionRate > 0 ? '-' : compressionRate < 0 ? '+' : ''}{Math.abs(
                      compressionRate
                    )}%
                  </p>
                </div>
              </div>

              <!-- 尺寸信息 -->
              <p class="text-sm text-muted-foreground">
                {convertResult.width} × {convertResult.height} 像素
              </p>

              <!-- 下载按钮 -->
              <Button onclick={handleDownload} class="w-full">
                <Icon icon="mdi:download" class="mr-2 size-4" />
                下载转换结果
              </Button>
            </div>
          </CardContent>
        </Card>
      {/if}

      <!-- 错误提示 -->
      {#if error}
        <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
          <div class="flex items-center gap-2">
            <Icon icon="mdi:alert-circle" class="size-5" />
            <p>{error}</p>
          </div>
        </div>
      {/if}
    </div>

    <!-- 右栏：转换设置 -->
    <div class="space-y-6">
      <!-- 格式选择 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Icon icon="mdi:file-image" class="size-5" />
            输出格式
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={options.format} onValueChange={(v: string) => (options.format = v as OutputFormat)}>
            <TabsList class="w-full">
              {#each availableFormats as format}
                <TabsTrigger value={format.value} class="flex-1">
                  {format.label}
                </TabsTrigger>
              {/each}
            </TabsList>
          </Tabs>

          {#if options.format === 'image/avif' && !avifSupported}
            <p class="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
              <Icon icon="mdi:alert" class="mr-1 inline size-4" />
              您的浏览器可能不支持 AVIF 格式
            </p>
          {/if}
        </CardContent>
      </Card>

      <!-- 质量设置 -->
      {#if showQuality}
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Icon icon="mdi:quality-high" class="size-5" />
              输出质量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <Slider
                type="single"
                value={options.quality}
                onValueChange={(v: number) => (options.quality = v)}
                min={0.1}
                max={1}
                step={0.05}
              />
              <div class="flex justify-between text-sm text-muted-foreground">
                <span>低质量（小文件）</span>
                <span>{Math.round(options.quality * 100)}%</span>
                <span>高质量（大文件）</span>
              </div>
            </div>
          </CardContent>
        </Card>
      {/if}

      <!-- 尺寸调整 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Icon icon="mdi:resize" class="size-5" />
            尺寸调整
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <!-- 保持比例开关 -->
            <div class="flex items-center justify-between">
              <span class="text-sm">保持宽高比</span>
              <Switch bind:checked={options.maintainAspectRatio} />
            </div>

            <!-- 宽高输入 -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1 block text-sm text-muted-foreground">宽度</label>
                <Input
                  type="number"
                  bind:value={widthInput}
                  placeholder="宽度"
                  min="1"
                  onchange={handleWidthChange}
                />
              </div>
              <div>
                <label class="mb-1 block text-sm text-muted-foreground">高度</label>
                <Input
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
              <p class="mb-2 text-sm text-muted-foreground">预设缩放</p>
              <div class="flex flex-wrap gap-2">
                {#each PRESET_SCALES as preset}
                  <Button
                    variant="outline"
                    size="sm"
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
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Icon icon="mdi:cog" class="size-5" />
              高级选项
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div>
                <label class="mb-1 block text-sm text-muted-foreground">背景颜色</label>
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    bind:value={options.backgroundColor}
                    class="size-10 cursor-pointer rounded border"
                  />
                  <Input
                    type="text"
                    bind:value={options.backgroundColor}
                    placeholder="#ffffff"
                    class="flex-1"
                  />
                </div>
                <p class="mt-1 text-xs text-muted-foreground">
                  透明图片转 JPG 时的填充颜色
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      {/if}

      <!-- 操作按钮 -->
      <div class="space-y-3">
        <Button
          class="w-full"
          size="lg"
          onclick={handleConvert}
          disabled={!sourceImage || isConverting}
        >
          {#if isConverting}
            <Icon icon="mdi:loading" class="mr-2 size-4 animate-spin" />
            转换中...
          {:else}
            <Icon icon="mdi:swap-horizontal" class="mr-2 size-4" />
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
