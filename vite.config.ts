import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { postImagesPlugin } from './vite-plugins/post-images.js';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), postImagesPlugin()],
	build: {
		target: 'es2022'
	}
});
