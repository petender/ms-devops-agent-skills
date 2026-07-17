#!/usr/bin/env node
/**
 * npm run new-skill -- --slug my-skill --name "My Skill" --category ci
 * Writes a catalog/<slug>/ folder from templates.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

function argv(name, defaultValue = '') {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return defaultValue;
  return process.argv[i + 1] ?? defaultValue;
}

const slug = argv('slug');
const name = argv('name');
const category = argv('category', 'ci');
if (!slug || !name) {
  console.error('Usage: npm run new-skill -- --slug <slug> --name "<Name>" [--category ci]');
  process.exit(1);
}

const dir = join(ROOT, 'catalog', slug);
if (existsSync(dir)) { console.error(`✖ catalog/${slug} already exists`); process.exit(1); }
await mkdir(dir, { recursive: true });

const metadata = {
  name,
  description: `TODO: one-line catalog summary for ${name}.`,
  category,
  platforms: ['GitHub Copilot', 'Claude', 'Copilot CLI', 'Copilot Cloud Agent'],
  tools: [],
  tags: ['todo'],
  level: 'intermediate',
  estimatedMinutes: 20,
  collections: [],
  author: 'DevOps Community',
  version: '1.0.0',
};

const skillMd = `---
name: ${slug}
description: Use this skill whenever the user asks to TODO — replace with an agent-facing trigger sentence.
---

# ${name}

TODO: Rewrite this section as agent-facing instructions. Focus on:

- **When to invoke** — the exact user intent that should trigger this skill.
- **Inputs** — what the agent should collect or ask for.
- **Process** — the ordered steps the agent should take, with any pre-checks.
- **Output** — the expected artifact (files, PR, terminal commands, etc.).

Keep it concise (under ~200 lines is ideal).

This SKILL.md is a single portable file per the [Agent Skills open standard](https://agentskills.io/).
It is loaded natively by GitHub Copilot (VS Code, CLI, Cloud Agent), Claude, and any
other agent that implements the standard. Do **not** create a separate copilot instructions
file — the same SKILL.md serves every supported client.
`;

const trainerMd = `---
learningObjectives:
  - TODO: an outcome the learner will be able to do after the session.
prerequisites:
  - TODO
demoScriptMinutes: 10
exercises:
  - title: "TODO"
    durationMinutes: 15
    summary: "TODO — 1–2 sentences describing the exercise."
discussionQuestions:
  - "TODO"
commonPitfalls:
  - "TODO"
slideTalkingPoints:
  - "TODO"
---

Optional narrative for the trainer — this body is not rendered by the site
but is preserved in the .zip bundle for reference.
`;

await writeFile(join(dir, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n', 'utf8');
await writeFile(join(dir, 'SKILL.md'), skillMd, 'utf8');
await writeFile(join(dir, 'trainer.md'), trainerMd, 'utf8');

console.log(`✔ scaffolded catalog/${slug}`);
console.log('Next: edit the files, then run `npm run validate` and `npm run dev`.');
