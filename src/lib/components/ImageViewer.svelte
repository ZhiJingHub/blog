<script lang="ts">
	import { onMount } from 'svelte';
	import PhotoSwipeLightbox from 'photoswipe/lightbox';
	import 'photoswipe/style.css';

	onMount(() => {
		const lightbox = new PhotoSwipeLightbox({
			gallery: '.prose',
			children: 'img',
			pswpModule: () => import('photoswipe')
		});

		lightbox.addFilter('itemData', (itemData) => {
			const img = itemData.element as HTMLImageElement;
			return {
				src: img.src,
				width: img.naturalWidth || 800,
				height: img.naturalHeight || 600,
				alt: img.alt || ''
			};
		});

		lightbox.on('uiRegister', () => {
			for (const img of document.querySelectorAll('.prose img')) {
				(img as HTMLElement).style.cursor = 'zoom-in';
			}
		});

		lightbox.init();
		return () => lightbox.destroy();
	});
</script>
