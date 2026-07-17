import { describe, it, expect } from 'vitest';
import { renderCover, hashString, paletteFor } from '../src/lib/cover';
import { CATEGORIES } from '../src/content/config';

describe('cover.ts', () => {
  it('hashString is deterministic', () => {
    expect(hashString('foo')).toBe(hashString('foo'));
    expect(hashString('foo')).not.toBe(hashString('bar'));
  });

  it('renderCover is deterministic per (slug, category)', () => {
    const a = renderCover({ slug: 'bicep-module-generator', category: 'iac' });
    const b = renderCover({ slug: 'bicep-module-generator', category: 'iac' });
    expect(a).toBe(b);
  });

  it('each category has a distinct palette', () => {
    const seen = new Set<string>();
    for (const c of CATEGORIES) {
      const p = paletteFor(c);
      const key = `${p.bg}|${p.fg}|${p.accent}`;
      expect(seen.has(key), `duplicate palette for ${c}`).toBe(false);
      seen.add(key);
    }
    expect(seen.size).toBe(CATEGORIES.length);
  });

  it('renderCover emits an <svg> string with role=img', () => {
    const svg = renderCover({ slug: 'x', category: 'ci' });
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('role="img"');
  });
});
