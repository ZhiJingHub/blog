/**
 * 平台检测工具函数
 */

/** 是否部署在 Cloudflare 平台 */
export const isCloudflare = __PLATFORM__ === 'cloudflare' || __PLATFORM__ === 'cf-pages';
