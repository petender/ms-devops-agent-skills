/**
 * Deterministic gradient cover generator.
 *
 * Pure: (slug, category) → SVG string. Same inputs always produce the same
 * output. The cover is a diagonal linear gradient tinted by the category
 * family, with the category glyph badge and per-slug hue rotation so each
 * card feels distinct while still signaling its category.
 */

import { CATEGORIES } from '@/content/config';

type Category = (typeof CATEGORIES)[number];

// Two HSL gradient stops per category. Hue drives category identity; the
// per-slug seed rotates hue by ±20° so no two covers look identical.
const PALETTE: Record<
  Category,
  { fromH: number; fromS: number; fromL: number; toH: number; toS: number; toL: number; glyphFg: string }
> = {
  ci:        { fromH: 172, fromS: 78, fromL: 22, toH: 158, toS: 72, toL: 42, glyphFg: '#d1fae5' },
  iac:       { fromH: 236, fromS: 68, fromL: 22, toH: 258, toS: 72, toL: 52, glyphFg: '#e0e7ff' },
  container: { fromH:  22, fromS: 82, fromL: 22, toH:  38, toS: 92, toL: 48, glyphFg: '#fef3c7' },
  k8s:       { fromH: 224, fromS: 72, fromL: 22, toH: 208, toS: 84, toL: 46, glyphFg: '#dbeafe' },
  security:  { fromH:   0, fromS: 68, fromL: 24, toH: 348, toS: 78, toL: 46, glyphFg: '#fee2e2' },
  obs:       { fromH: 140, fromS: 72, fromL: 20, toH: 152, toS: 68, toL: 42, glyphFg: '#dcfce7' },
  release:   { fromH: 268, fromS: 68, fromL: 26, toH: 288, toS: 68, toL: 52, glyphFg: '#ede9fe' },
  ir:        { fromH: 340, fromS: 72, fromL: 22, toH: 352, toS: 82, toL: 48, glyphFg: '#ffe4e6' },
  finops:    { fromH:  32, fromS: 82, fromL: 22, toH:  48, toS: 88, toL: 48, glyphFg: '#fef9c3' },
};

const GLYPH: Record<Category, string> = {
  // Simple pictograms rendered as SVG paths inside a 64x64 viewport centered.
  ci:        'M12 32 L28 32 L36 20 L44 32 L52 32 M20 40 L44 40',
  iac:       'M12 20 H52 M12 32 H52 M12 44 H52',
  container: 'M14 22 H50 V46 H14 Z M14 30 H50 M22 22 V46 M42 22 V46',
  k8s:       'M32 12 L52 24 L52 40 L32 52 L12 40 L12 24 Z',
  security:  'M32 10 L52 18 V32 C52 44 32 54 32 54 C32 54 12 44 12 32 V18 Z',
  obs:       'M12 46 L22 30 L32 38 L44 18 L52 26',
  release:   'M14 32 L50 32 M40 22 L50 32 L40 42',
  ir:        'M32 12 L52 50 L12 50 Z M32 26 V40 M32 44 V46',
  finops:    'M20 40 V22 H28 V40 M32 40 V26 H40 V40 M14 46 H50',
};

/**
 * Fast, deterministic 32-bit string hash (djb2 xor variant).
 * Kept as its own function so the unit test can pin the algorithm.
 */
export function hashString(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return h >>> 0;
}

function hsl(h: number, s: number, l: number): string {
  const H = ((h % 360) + 360) % 360;
  return `hsl(${H} ${s}% ${l}%)`;
}

export function paletteFor(category: Category): { bg: string; fg: string; accent: string } {
  // Legacy shape kept for tests. Returns representative colors derived
  // from the gradient stops so palette-uniqueness tests still pass.
  const p = PALETTE[category];
  return {
    bg: hsl(p.fromH, p.fromS, p.fromL),
    fg: p.glyphFg,
    accent: hsl(p.toH, p.toS, p.toL),
  };
}

/** Extract 1–3 uppercase initials from a slug. `reusable-workflow-refactor` → `RWR`. */
function initialsFrom(slug: string): string {
  const parts = slug.split(/[-_/]/).filter(Boolean);
  const letters = parts.map((p) => p[0]).join('').toUpperCase();
  return letters.slice(0, 3);
}

/** Escape characters that would break inside an SVG text node. */
function escapeSvg(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Greedy word-wrap into at most `maxLines` lines of ≤ `maxChars` each. */
function wrapTitle(title: string, maxChars: number, maxLines: number): string[] {
  const words = title.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[kept.length - 1] = `${kept[kept.length - 1].replace(/[\s\-–—:]+$/, '')}…`;
    return kept;
  }
  return lines;
}

export interface CoverOptions {
  slug: string;
  category: Category;
  width?: number;
  height?: number;
  /** Optional display title. When provided, it is rendered inside the cover
   *  (bottom-left) instead of the decorative slug-initials watermark. */
  title?: string;
}

export function renderCover({ slug, category, width = 640, height = 360, title }: CoverOptions): string {
  const p = PALETTE[category];
  const glyph = GLYPH[category];
  const seed = hashString(slug);

  // Per-slug hue rotation (±20°) so each skill in the same category has
  // its own visual identity while staying in family.
  const hueShift = (seed % 41) - 20;
  const from = hsl(p.fromH + hueShift, p.fromS, p.fromL);
  const to = hsl(p.toH + hueShift, p.toS, p.toL);
  const highlight = hsl(p.toH + hueShift, Math.min(100, p.toS + 8), Math.min(72, p.toL + 12));

  // Gradient direction: pick one of four diagonals deterministically.
  const dirs: Array<[number, number, number, number]> = [
    [0, 0, 1, 1], // ↘
    [1, 0, 0, 1], // ↙
    [0, 1, 1, 0], // ↗
    [0, 0, 1, 0], // →
  ];
  const [x1, y1, x2, y2] = dirs[(seed >>> 4) % dirs.length];

  const gradId = `g-${seed.toString(36)}`;
  const glowId = `glow-${seed.toString(36)}`;

  // Category glyph badge (top-left corner) — the constant identity marker.
  const badgeX = 28;
  const badgeY = 28;

  // Foreground content: skill title (wrapped) if supplied, otherwise the
  // legacy slug-initials watermark.
  let foreground: string;
  if (title && title.trim()) {
    const lines = wrapTitle(title.trim(), 16, 3);
    // Font size scales down as line count grows so a 3-line title still fits.
    const fontSize = lines.length >= 3 ? 44 : lines.length === 2 ? 54 : 64;
    const lineH = Math.round(fontSize * 1.08);
    const startY = height - 44 - (lines.length - 1) * lineH;
    const tspans = lines
      .map((ln, i) => `<tspan x="40" dy="${i === 0 ? 0 : lineH}">${escapeSvg(ln)}</tspan>`)
      .join('');
    foreground = `<text x="40" y="${startY}" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-weight="800" font-size="${fontSize}" fill="${p.glyphFg}" fill-opacity="0.92" style="letter-spacing:-0.02em">${tspans}</text>`;
  } else {
    const initials = initialsFrom(slug);
    const initialsX = width - 40;
    const initialsY = height - 40;
    foreground = `<text x="${initialsX}" y="${initialsY}" text-anchor="end" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-weight="800" font-size="${Math.round(height * 0.42)}" fill="${p.glyphFg}" fill-opacity="0.16" style="letter-spacing:-0.04em">${initials}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" role="img" aria-label="Cover for ${slug}" style="display:block">
  <defs>
    <linearGradient id="${gradId}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="${glowId}" cx="80%" cy="20%" r="70%">
      <stop offset="0%" stop-color="${highlight}" stop-opacity="0.55"/>
      <stop offset="60%" stop-color="${highlight}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#${gradId})"/>
  <rect width="${width}" height="${height}" fill="url(#${glowId})"/>
  ${foreground}
  <g transform="translate(${badgeX} ${badgeY})">
    <rect width="64" height="64" rx="14" fill="${p.glyphFg}" fill-opacity="0.18" stroke="${p.glyphFg}" stroke-opacity="0.55" stroke-width="1.5"/>
    <path d="${glyph}" fill="none" stroke="${p.glyphFg}" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}
