import { describe, it, expect } from 'vitest';
import paths from '../src/data/learning-paths.json';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

describe('learning-paths.json', () => {
  it('every referenced slug exists in submissions/', () => {
    const submissions = new Set<string>();
    const dir = join(process.cwd(), 'submissions');
    if (existsSync(dir)) {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) submissions.add(e.name);
      }
    }
    const missing: string[] = [];
    for (const p of paths as Array<{ slug: string; skills: string[] }>) {
      for (const s of p.skills) {
        if (!submissions.has(s)) missing.push(`${p.slug} → ${s}`);
      }
    }
    expect(missing, `missing skills referenced by learning paths:\n${missing.join('\n')}`).toEqual([]);
  });

  it('every path has a unique slug', () => {
    const slugs = (paths as Array<{ slug: string }>).map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
