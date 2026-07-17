// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Change `site` + `base` to match your GitHub Pages URL.
// Example: https://<owner>.github.io/ms-devops-agent-skills/
const SITE = process.env.SITE_URL ?? 'https://example.github.io';
const BASE = process.env.SITE_BASE ?? '/ms-devops-agent-skills';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'ignore',
  integrations: [tailwind({ applyBaseStyles: false }), mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
  },
});
