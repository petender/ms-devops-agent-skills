import { describe, it, expect } from 'vitest';
import collections from '../src/data/collections.json';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

describe('collections.json', () => {
  it('every referenced slug exists in submissions/', () => {
    const submissions = new Set<string>();
    const dir = join(process.cwd(), 'submissions');
    if (existsSync(dir)) {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) submissions.add(e.name);
      }
    }
    const missing: string[] = [];
    for (const c of collections as Array<{ slug: string; skills: string[] }>) {
      for (const s of c.skills) {
        if (!submissions.has(s)) missing.push(`${c.slug} → ${s}`);
      }
    }
    expect(missing, `missing skills referenced by collections:\n${missing.join('\n')}`).toEqual([]);
  });

  it('every collection has a unique slug', () => {
    const slugs = (collections as Array<{ slug: string }>).map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
