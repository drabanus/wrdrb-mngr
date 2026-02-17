import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		paths: {
			base: '/garderobe'
		},
		alias: {
			$lib: 'src/lib',
			$i18n: 'src/i18n'
		}
	}
};

export default config;
