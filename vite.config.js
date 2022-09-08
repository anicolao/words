import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	build: { target: 'es2020' },
	test: { include: ['src/**/*.unit.ts'] }
};

export default config;
