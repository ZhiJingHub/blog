import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { postImagesPlugin } from './vite-plugins/post-images.js';
import redirectsPlugin from './vite-plugins/redirects.js';
import { redirects } from './src/lib/config/redirects';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), postImagesPlugin(), redirectsPlugin(redirects)],
	build: {
		target: 'es2022'
	}
});
