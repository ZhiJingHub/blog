import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

injectSpeedInsights();

export const prerender = true;
export const ssr = true;
export const trailingSlash = 'always';
