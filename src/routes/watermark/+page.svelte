<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Switch } from '$lib/components/ui/switch';
  import { Slider } from '$lib/components/ui/slider';
  import { Badge } from '$lib/components/ui/badge';
  import Icon from '@iconify/svelte';
  import { siteConfig } from '$lib/config/site';
  import type { WatermarkItem } from './_types';
  import { DEFAULT_WATERMARK, POSITION_OPTIONS } from './_types';
  import type { LoadedImage } from './_image-utils';
  import { loadImage, revokeUrl, formatFileSize } from './_image-utils';
  import { generatePreview, exportWatermarkedImage } from './_watermark';

  // 状态
  let sourceImage = $state<LoadedImage | null>(null);
  let watermarks = $state<WatermarkItem[]>([]);
  let previewUrl = $state<string | null>(null);
  let isGenerating = $state(false);
  let isDragging = $state(false);
  let error = $state<string | null>(null);

  // 添加新水印
  function addWatermark(type: 'text' | 'image') {
    const id = crypto.randomUUID();
    watermarks = [...watermarks, { ...DEFAULT_WATERMARK, id, type }];
  }

  // 删除水印
  function removeWatermark(id: string) {
    const item = watermarks.find((w) => w.id === id);
    if (item?.imageUrl) {
      URL.revokeObjectURL(item.imageUrl);
    }
    watermarks = watermarks.filter((w) => w.id !== id);
  }

  // 更新水印
  function updateWatermark(id: string, updates: Partial<WatermarkItem>) {
    watermarks = watermarks.map((w) => (w.id === id ? { ...w, ...updates } : w));
  }

  // 处理文件上传
  async function handleFileUpload(file: File) {
    error = null;
    previewUrl = null;

    if (!file.type.startsWith('image/')) {
      error = '请上传图片文件';
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      error = '文件大小不能超过 50MB';
      return;
    }

    try {
      if (sourceImage) {
        revokeUrl(sourceImage.url);
      }
      sourceImage = await loadImage(file);
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

  // 生成预览
  async function handlePreview() {
    if (!sourceImage || watermarks.length === 0) return;

    isGenerating = true;
    error = null;

    try {
      previewUrl = await generatePreview(sourceImage.img, watermarks);
    } catch (e) {
      error = e instanceof Error ? e.message : '生成预览失败';
    } finally {
      isGenerating = false;
    }
  }

  // 导出图片
  async function handleExport() {
    if (!sourceImage || watermarks.length === 0) return;

    isGenerating = true;
    error = null;

    try {
      const blob = await exportWatermarkedImage(sourceImage.img, watermarks, 'image/png');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `watermarked-${sourceImage.file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      error = e instanceof Error ? e.message : '导出失败';
    } finally {
      isGenerating = false;
    }
  }

  // 处理水印图片上传
  function handleWatermarkImageUpload(watermarkId: string, file: File) {
    const item = watermarks.find((w) => w.id === watermarkId);
    if (item?.imageUrl) {
      URL.revokeObjectURL(item.imageUrl);
    }

    const url = URL.createObjectURL(file);
    updateWatermark(watermarkId, { imageUrl: url, imageFile: file });
  }

  // 重置
  function handleReset() {
    if (sourceImage) {
      revokeUrl(sourceImage.url);
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    watermarks.forEach((w) => {
      if (w.imageUrl) URL.revokeObjectURL(w.imageUrl);
    });

    sourceImage = null;
    previewUrl = null;
    watermarks = [];
    error = null;
  }

  // 清理资源
  onMount(() => {
    return () => {
      if (sourceImage) revokeUrl(sourceImage.url);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      watermarks.forEach((w) => {
        if (w.imageUrl) URL.revokeObjectURL(w.imageUrl);
      });
    };
  });
</script>

<svelte:head>
  <title>图片水印 - {siteConfig.title}</title>
  <meta name="description" content="在线图片添加水印工具，支持文字水印和图片水印，支持多种水印方案" />
</svelte:head>

<div class="min-h-screen bg-background">
  <div class="container mx-auto max-w-7xl px-4 pt-6 pb-12 sm:pt-8">
    <div class="mb-6">
      <a href="/" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <Icon icon="mdi:chevron-left" class="size-4" />
        返回首页
      </a>
    </div>

    <div class="watermark-layout">
      <!-- 标题 -->
      <div class="watermark-title-col">
        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">图片水印</h1>
        <p class="mt-2 text-sm text-muted-foreground">
          在线图片添加水印工具，支持文字水印和图片水印，支持多种水印方案同时添加
        </p>
      </div>

      <!-- 预览区域 -->
      <div class="watermark-preview-col">
        <!-- 上传区域 -->
        <div
          class="upload-area {isDragging ? 'dragging' : ''} {sourceImage ? 'has-image' : ''}"
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
              <div class="relative w-full">
                {#if previewUrl}
                  <img src={previewUrl} alt="水印预览" class="mx-auto max-h-[350px] rounded-lg object-contain" />
                  <Badge variant="default" class="absolute left-2 top-2">水印效果</Badge>
                {:else}
                  <img src={sourceImage.url} alt="原图预览" class="mx-auto max-h-[350px] rounded-lg object-contain" />
                  <Badge variant="secondary" class="absolute left-2 top-2">原图</Badge>
                {/if}
              </div>
              <div class="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                <span>{sourceImage.file.name}</span>
                <span>{sourceImage.width} × {sourceImage.height}</span>
                <span>{formatFileSize(sourceImage.file.size)}</span>
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

        <!-- 错误提示 -->
        {#if error}
          <div class="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            <Icon icon="mdi:alert-circle" class="mr-2 inline size-4" />
            {error}
          </div>
        {/if}

        <!-- 操作按钮 -->
        <div class="rounded-xl border border-border bg-card p-4">
          <div class="flex gap-3">
            <Button
              class="flex-1"
              size="lg"
              onclick={handlePreview}
              disabled={!sourceImage || watermarks.length === 0 || isGenerating}
            >
              {#if isGenerating}
                <Icon icon="mdi:loading" class="mr-2 size-5 animate-spin" />
                生成中...
              {:else}
                <Icon icon="mdi:eye" class="mr-2 size-5" />
                预览效果
              {/if}
            </Button>
            <Button
              class="flex-1"
              size="lg"
              variant="default"
              onclick={handleExport}
              disabled={!sourceImage || watermarks.length === 0 || isGenerating}
            >
              <Icon icon="mdi:download" class="mr-2 size-5" />
              导出图片
            </Button>
          </div>
          <Button
            variant="outline"
            class="mt-2 w-full"
            onclick={handleReset}
          >
            <Icon icon="mdi:refresh" class="mr-2 size-4" />
            重置
          </Button>
        </div>
      </div>

      <!-- 水印设置面板 -->
      <div class="watermark-settings-col">
        <!-- 添加水印按钮 -->
        <div class="settings-card">
          <h3 class="settings-title">
            <Icon icon="mdi:plus-circle" class="size-4" />
            添加水印
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <Button variant="outline" onclick={() => addWatermark('text')}>
              <Icon icon="mdi:format-text" class="mr-1 size-4" />
              文字水印
            </Button>
            <Button variant="outline" onclick={() => addWatermark('image')}>
              <Icon icon="mdi:image" class="mr-1 size-4" />
              图片水印
            </Button>
          </div>
        </div>

        <!-- 水印列表 -->
        {#if watermarks.length === 0}
          <div class="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            <Icon icon="mdi:watermark" class="size-8" />
            <p class="text-sm">暂无水印</p>
            <p class="text-xs">点击上方按钮添加水印</p>
          </div>
        {:else}
          {#each watermarks as watermark (watermark.id)}
            <div class="settings-card {watermark.enabled ? '' : 'opacity-60'}">
              <div class="flex items-center justify-between">
                <h3 class="settings-title mb-0">
                  <Icon icon={watermark.type === 'text' ? 'mdi:format-text' : 'mdi:image'} class="size-4" />
                  {watermark.type === 'text' ? '文字水印' : '图片水印'}
                </h3>
                <div class="flex items-center gap-2">
                  <Switch
                    checked={watermark.enabled}
                    onCheckedChange={(v) => updateWatermark(watermark.id, { enabled: v })}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    class="size-7 p-0 text-destructive"
                    onclick={() => removeWatermark(watermark.id)}
                  >
                    <Icon icon="mdi:delete" class="size-4" />
                  </Button>
                </div>
              </div>

              {#if watermark.enabled}
                {#if watermark.type === 'text'}
                  <!-- 文字内容 -->
                  <div>
                    <label for="wm-text-{watermark.id}" class="mb-1 block text-xs text-muted-foreground">水印文字</label>
                    <Input
                      id="wm-text-{watermark.id}"
                      type="text"
                      value={watermark.text}
                      oninput={(e) => updateWatermark(watermark.id, { text: (e.target as HTMLInputElement).value })}
                      placeholder="请输入水印文字"
                      class="w-full"
                    />
                  </div>

                  <!-- 字体大小和颜色 -->
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="mb-1 block text-xs text-muted-foreground">字体大小</label>
                      <div class="flex items-center gap-2">
                        <Slider
                          type="single"
                          value={watermark.fontSize}
                          onValueChange={(v: number) => updateWatermark(watermark.id, { fontSize: v })}
                          min={12}
                          max={72}
                          step={1}
                        />
                        <span class="w-8 text-right text-xs text-muted-foreground">{watermark.fontSize}</span>
                      </div>
                    </div>
                    <div>
                      <label class="mb-1 block text-xs text-muted-foreground">颜色</label>
                      <input
                        type="color"
                        value={watermark.color}
                        oninput={(e) => updateWatermark(watermark.id, { color: (e.target as HTMLInputElement).value })}
                        class="size-9 cursor-pointer rounded border"
                      />
                    </div>
                  </div>

                  <!-- 旋转角度 -->
                  <div>
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-muted-foreground">旋转角度</span>
                      <span class="text-xs text-muted-foreground">{watermark.rotation}°</span>
                    </div>
                    <Slider
                      type="single"
                      value={watermark.rotation}
                      onValueChange={(v: number) => updateWatermark(watermark.id, { rotation: v })}
                      min={-180}
                      max={180}
                      step={5}
                    />
                  </div>
                {:else}
                  <!-- 图片水印上传 -->
                  <div>
                    <label class="mb-1 block text-xs text-muted-foreground">水印图片</label>
                    <div class="flex items-center gap-2">
                      {#if watermark.imageUrl}
                        <img src={watermark.imageUrl} alt="水印" class="size-10 rounded border object-contain" />
                      {/if}
                      <Button
                        variant="outline"
                        size="sm"
                        onclick={() => document.getElementById(`wm-image-${watermark.id}`)?.click()}
                      >
                        <Icon icon="mdi:upload" class="mr-1 size-4" />
                        {watermark.imageUrl ? '更换' : '上传'}
                      </Button>
                      {#if watermark.imageUrl}
                        <Button
                          variant="ghost"
                          size="sm"
                          onclick={() => {
                            if (watermark.imageUrl) URL.revokeObjectURL(watermark.imageUrl);
                            updateWatermark(watermark.id, { imageUrl: undefined, imageFile: undefined });
                          }}
                        >
                          <Icon icon="mdi:close" class="size-4" />
                        </Button>
                      {/if}
                    </div>
                    <input
                      id="wm-image-{watermark.id}"
                      type="file"
                      accept="image/*"
                      class="hidden"
                      onchange={(e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleWatermarkImageUpload(watermark.id, file);
                      }}
                    />
                  </div>

                  <!-- 水印大小 -->
                  <div>
                    <label class="mb-1 block text-xs text-muted-foreground">水印大小</label>
                    <div class="flex items-center gap-2">
                      <Slider
                        type="single"
                        value={watermark.imageSize}
                        onValueChange={(v: number) => updateWatermark(watermark.id, { imageSize: v })}
                        min={20}
                        max={300}
                        step={5}
                      />
                      <span class="w-10 text-right text-xs text-muted-foreground">{watermark.imageSize}px</span>
                    </div>
                  </div>
                {/if}

                <!-- 位置选择 -->
                <div>
                  <p class="mb-1 text-xs text-muted-foreground">位置</p>
                  <div class="grid grid-cols-3 gap-1.5">
                    {#each POSITION_OPTIONS as pos}
                      <Button
                        variant={watermark.position === pos.value ? 'default' : 'outline'}
                        size="sm"
                        class="text-xs"
                        onclick={() => updateWatermark(watermark.id, { position: pos.value })}
                      >
                        {pos.label}
                      </Button>
                    {/each}
                  </div>
                </div>

                <!-- 透明度 -->
                <div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-muted-foreground">透明度</span>
                    <span class="text-xs text-muted-foreground">{Math.round(watermark.opacity * 100)}%</span>
                  </div>
                  <Slider
                    type="single"
                    value={watermark.opacity}
                    onValueChange={(v: number) => updateWatermark(watermark.id, { opacity: v })}
                    min={0.05}
                    max={1}
                    step={0.05}
                  />
                </div>

                <!-- 平铺间距 -->
                {#if watermark.position === 'tile'}
                  <div>
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-muted-foreground">平铺间距</span>
                      <span class="text-xs text-muted-foreground">{watermark.tileSpacing}px</span>
                    </div>
                    <Slider
                      type="single"
                      value={watermark.tileSpacing}
                      onValueChange={(v: number) => updateWatermark(watermark.id, { tileSpacing: v })}
                      min={50}
                      max={300}
                      step={10}
                    />
                  </div>
                {/if}
              {/if}
            </div>
          {/each}
        {/if}

        <div class="scroll-indicator"></div>
      </div>
    </div>
  </div>
</div>

<style>
  .watermark-layout {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .watermark-title-col {
    display: block;
  }
  .watermark-preview-col {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    min-width: 0;
  }
  .watermark-settings-col {
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
    .watermark-layout {
      display: grid;
      grid-template-columns: 1fr 400px;
      grid-template-rows: auto 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    .watermark-title-col {
      grid-column: 1;
      grid-row: 1;
    }
    .watermark-preview-col {
      grid-column: 1;
      grid-row: 2;
      position: sticky;
      top: 1.5rem;
    }
    .watermark-settings-col {
      grid-column: 2;
      grid-row: 1 / -1;
      max-height: calc(100vh - 3rem);
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--muted-foreground) transparent;
      scrollbar-gutter: stable;
    }
    .watermark-settings-col::-webkit-scrollbar { width: 6px; }
    .watermark-settings-col::-webkit-scrollbar-track { background: transparent; }
    .watermark-settings-col::-webkit-scrollbar-thumb { background-color: var(--muted-foreground); border-radius: 3px; min-height: 30px; }
    .scroll-indicator {
      display: block;
      position: sticky;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2rem;
      background: linear-gradient(to top, var(--background), transparent);
      pointer-events: none;
      flex-shrink: 0;
      margin-top: -2rem;
      z-index: 1;
    }
  }

  @media (min-width: 1280px) {
    .watermark-layout {
      grid-template-columns: 1fr 460px;
    }
  }
</style>
