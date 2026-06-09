<script lang="ts">
  import Icon from '@iconify/svelte';
  import ThemeToggle from './ThemeToggle.svelte';

  let { title, icon, description }: { title: string; icon?: string; description?: string } = $props();
</script>

<div class="page-header">
  <div class="page-header-left">
    <a href="/" class="back-link">
      <Icon icon="mdi:chevron-left" class="size-4" />
      返回首页
    </a>
    <h1 class="page-title">
      {#if icon}
        <Icon {icon} class="title-icon" />
      {/if}
      {title}
    </h1>
    {#if description}
      <p class="page-description">{description}</p>
    {/if}
  </div>
  <div class="page-header-right">
    <ThemeToggle />
  </div>
</div>

<style>
  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .page-header-left {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .page-header-right {
    flex-shrink: 0;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    color: var(--muted-foreground);
    transition: color 0.2s;
  }

  .back-link:hover {
    color: var(--foreground);
  }

  .page-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.2;
  }

  @media (min-width: 640px) {
    .page-title {
      font-size: 1.875rem;
    }
  }

  :global(.title-icon) {
    width: 2rem;
    height: 2rem;
    color: var(--primary);
  }

  @media (min-width: 640px) {
    :global(.title-icon) {
      width: 2.25rem;
      height: 2.25rem;
    }
  }

  .page-description {
    font-size: 0.875rem;
    color: var(--muted-foreground);
    max-width: 40rem;
  }
</style>
