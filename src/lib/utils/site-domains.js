/** 站内域名白名单（支持子域名匹配） */
export const SITE_DOMAINS = ['iwexe.top', 'iwecc.dpdns.org', 'iwecc.qzz.io'];

export function isInternalDomain(hostname) {
	return SITE_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
}
