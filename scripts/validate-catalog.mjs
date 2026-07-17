#!/usr/bin/env node
/**
 * Validate every catalog entry folder.
 *
 * Checks:
 *   - metadata.json parses and matches the shared schema
 *   - SKILL.md has frontmatter with `name` + `description`
 *     (SKILL.md is a single portable file per the Agent Skills open standard;
 *     it is loaded natively by both GitHub Copilot and Claude)
 *   - trainer.md (if present) has parseable YAML frontmatter
 *   - the slug in metadata.json matches the folder name
 *
 * Exits non-zero on the first batch of failures found so CI blocks the PR.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './lib/frontmatter.mjs';
import { validateMetadata, validateTrainer } from './lib/schema.mjs';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const CATALOG_DIR = join(ROOT, 'catalog');

const errors = [];
const warnings = [];

function fail(where, msg) { errors.push(`✖ ${where}: ${msg}`); }
function warn(where, msg) { warnings.push(`⚠ ${where}: ${msg}`); }

async function validateOne(slug) {
  const dir = join(CATALOG_DIR, slug);
  const metaPath = join(dir, 'metadata.json');
  const skillPath = join(dir, 'SKILL.md');
  const trainerPath = join(dir, 'trainer.md');

  if (!existsSync(metaPath)) return fail(slug, 'missing metadata.json');
  if (!existsSync(skillPath)) return fail(slug, 'missing SKILL.md');

  let meta;
  try { meta = JSON.parse(await readFile(metaPath, 'utf8')); }
  catch (e) { return fail(slug, `metadata.json parse error: ${e.message}`); }

  if (meta.slug && meta.slug !== slug) return fail(slug, `metadata.slug "${meta.slug}" does not match folder name`);
  meta.slug = slug;

  const metaResult = validateMetadata(meta);
  if (!metaResult.ok) return fail(slug, `metadata.json: ${metaResult.errors.join('; ')}`);

  const skill = parseFrontmatter(await readFile(skillPath, 'utf8'));
  if (!skill.data.name) fail(slug, 'SKILL.md missing frontmatter `name`');
  if (!skill.data.description) fail(slug, 'SKILL.md missing frontmatter `description`');
  if (skill.data.name && skill.data.name !== slug) fail(slug, `SKILL.md frontmatter \`name\` "${skill.data.name}" must match folder name "${slug}"`);
  if (skill.body.split('\n').length > 300) warn(slug, `SKILL.md body is ${skill.body.split('\n').length} lines — consider trimming`);

  if (existsSync(trainerPath)) {
    const t = parseFrontmatter(await readFile(trainerPath, 'utf8'));
    const tr = validateTrainer(t.data);
    if (!tr.ok) fail(slug, `trainer.md: ${tr.errors.join('; ')}`);
  }
}

async function main() {
  if (!existsSync(CATALOG_DIR)) return console.log('No catalog/ folder — nothing to validate.');
  const entries = (await readdir(CATALOG_DIR, { withFileTypes: true })).filter((e) => e.isDirectory());
  await Promise.all(entries.map((e) => validateOne(e.name)));

  for (const w of warnings) console.warn(w);
  for (const e of errors) console.error(e);

  if (errors.length) {
    console.error(`\n${errors.length} validation error${errors.length === 1 ? '' : 's'}.`);
    process.exit(1);
  }
  console.log(`✔ ${entries.length} catalog entr${entries.length === 1 ? 'y' : 'ies'} validated.${warnings.length ? ` (${warnings.length} warning${warnings.length === 1 ? '' : 's'})` : ''}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
