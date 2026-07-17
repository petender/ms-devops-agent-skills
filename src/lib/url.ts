/**
 * URL helpers. Astro's `import.meta.env.BASE_URL` returns the `base`
 * config value verbatim, which may or may not include a trailing slash
 * depending on how the config is written. `link()` normalizes both sides
 * so `link('skills/foo/')` always produces `/base/skills/foo/`.
 */
const RAW_BASE = import.meta.env.BASE_URL;
export const base = RAW_BASE.endsWith('/') ? RAW_BASE : `${RAW_BASE}/`;

export function link(path: string): string {
  return `${base}${path.replace(/^\/+/, '')}`;
}
