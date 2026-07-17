#!/usr/bin/env node
/**
 * Convert every catalog/<slug>/ into a content-collection entry at
 * src/content/skills/<slug>.md, plus emit optional .zip bundles into
 * public/bundles/<slug>.zip when the catalog entry ships scripts/assets/references.
 *
 * Runs as a prebuild step; skips work if src/content/skills already exists
 * with a newer mtime than the source folder.
 */
import { mkdir, readdir, readFile, writeFile, rm, copyFile, stat } from 'node:fs/promises';
import { existsSync, createWriteStream } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './lib/frontmatter.mjs';
import JSZip from 'jszip';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const CATALOG_DIR = join(ROOT, 'catalog');
const OUT_CONTENT = join(ROOT, 'src', 'content', 'skills');
const OUT_BUNDLES = join(ROOT, 'public', 'bundles');

async function walk(dir, base = dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, base)));
    else out.push({ full, rel: relative(base, full) });
  }
  return out;
}

async function hasAny(dir) {
  if (!existsSync(dir)) return false;
  const entries = await readdir(dir);
  return entries.length > 0;
}

function toYaml(v, indent = 0) {
  const pad = ' '.repeat(indent);
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    return '\n' + v.map((x) => `${pad}- ${typeof x === 'object' ? toYaml(x, indent + 2).trimStart() : yamlScalar(x)}`).join('\n');
  }
  if (v && typeof v === 'object') {
    return '\n' + Object.entries(v).map(([k, val]) => `${pad}${k}: ${typeof val === 'object' ? toYaml(val, indent + 2) : yamlScalar(val)}`).join('\n');
  }
  return yamlScalar(v);
}

function yamlScalar(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  const s = String(v);
  if (/^[A-Za-z0-9_./-]+$/.test(s) && !/^(true|false|null|~|yes|no)$/i.test(s)) return s;
  return JSON.stringify(s);
}

async function importOne(slug) {
  const dir = join(CATALOG_DIR, slug);
  const meta = JSON.parse(await readFile(join(dir, 'metadata.json'), 'utf8'));
  meta.slug = slug;

  const skill = parseFrontmatter(await readFile(join(dir, 'SKILL.md'), 'utf8'));

  const trainerPath = join(dir, 'trainer.md');
  let trainer = null;
  if (existsSync(trainerPath)) {
    trainer = parseFrontmatter(await readFile(trainerPath, 'utf8')).data;
    // Normalize empties.
    for (const k of ['learningObjectives', 'prerequisites', 'exercises', 'discussionQuestions', 'commonPitfalls', 'slideTalkingPoints']) {
      if (trainer[k] === null || trainer[k] === undefined) trainer[k] = [];
    }
    if (trainer.demoScriptMinutes === undefined || trainer.demoScriptMinutes === null) trainer.demoScriptMinutes = 0;
  }

  const assetsDir = join(dir, 'assets');
  const scriptsDir = join(dir, 'scripts');
  const referencesDir = join(dir, 'references');
  const hasAssets = await hasAny(assetsDir);
  const hasScripts = await hasAny(scriptsDir);
  const hasReferences = await hasAny(referencesDir);

  const frontmatter = {
    name: meta.name,
    description: meta.description,
    category: meta.category,
    platforms: meta.platforms,
    tools: meta.tools ?? [],
    tags: meta.tags,
    level: meta.level,
    estimatedMinutes: meta.estimatedMinutes,
    collections: meta.collections ?? [],
    author: meta.author ?? 'DevOps Community',
    ...(meta.authorUrl ? { authorUrl: meta.authorUrl } : {}),
    version: meta.version ?? '1.0.0',
    hasAssets,
    hasScripts,
    hasTrainerNotes: !!trainer,
    body: skill.body.trim(),
    ...(trainer ? { trainer } : {}),
  };

  const fm = Object.entries(frontmatter)
    .map(([k, v]) => {
      if (v === undefined) return null;
      if (Array.isArray(v)) return `${k}: ${v.length === 0 ? '[]' : toYaml(v, 2)}`;
      if (v && typeof v === 'object') return `${k}:${toYaml(v, 2)}`;
      // Multi-line string → block scalar
      if (typeof v === 'string' && v.includes('\n')) {
        const indented = v.split('\n').map((l) => `  ${l}`).join('\n');
        return `${k}: |\n${indented}`;
      }
      return `${k}: ${yamlScalar(v)}`;
    })
    .filter(Boolean)
    .join('\n');

  const md = `---\n${fm}\n---\n\n# ${meta.name}\n\n${meta.description}\n`;
  await mkdir(OUT_CONTENT, { recursive: true });
  await writeFile(join(OUT_CONTENT, `${slug}.md`), md, 'utf8');

  // Bundle scripts + assets + references as a .zip
  if (hasAssets || hasScripts || hasReferences) {
    const zip = new JSZip();
    // Include the single SKILL.md at the root of the bundle so recipients can
    // drop the whole folder into `.github/skills/<slug>/`, `.claude/skills/<slug>/`,
    // or `.agents/skills/<slug>/` per the Agent Skills open standard.
    zip.file('SKILL.md', await readFile(join(dir, 'SKILL.md'), 'utf8'));
    if (existsSync(trainerPath)) zip.file('trainer.md', await readFile(trainerPath, 'utf8'));
    zip.file('metadata.json', JSON.stringify(meta, null, 2));
    for (const src of [assetsDir, scriptsDir, referencesDir]) {
      if (!existsSync(src)) continue;
      const subName = src.split(/[\\/]/).pop();
      for (const file of await walk(src)) {
        const content = await readFile(file.full);
        zip.file(`${subName}/${file.rel.replace(/\\/g, '/')}`, content);
      }
    }
    await mkdir(OUT_BUNDLES, { recursive: true });
    const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    await writeFile(join(OUT_BUNDLES, `${slug}.zip`), buf);
  }
}

async function main() {
  if (!existsSync(CATALOG_DIR)) { console.log('No catalog/ folder — nothing to import.'); return; }
  // Clean.
  if (existsSync(OUT_CONTENT)) await rm(OUT_CONTENT, { recursive: true, force: true });
  if (existsSync(OUT_BUNDLES)) await rm(OUT_BUNDLES, { recursive: true, force: true });

  const entries = (await readdir(CATALOG_DIR, { withFileTypes: true })).filter((e) => e.isDirectory());
  for (const e of entries) {
    try { await importOne(e.name); }
    catch (err) { console.error(`✖ ${e.name}: ${err.message}`); process.exitCode = 1; }
  }
  console.log(`✔ imported ${entries.length} skill${entries.length === 1 ? '' : 's'}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
