import { describe, it, expect } from 'vitest';
import { rank } from '../src/lib/search';

const docs = [
  { slug: 'bicep-module-generator', name: 'Bicep Module Generator', description: 'Author idempotent Bicep modules.', category: 'iac', tags: ['iac','bicep','azure'], tools: ['Azure','Bicep'], level: 'intermediate', body: 'main.bicep parameter output' },
  { slug: 'dockerfile-hardener', name: 'Dockerfile Hardener', description: 'Rewrites a Dockerfile to be minimal, non-root, multi-stage.', category: 'container', tags: ['docker','security'], tools: ['Docker'], level: 'intermediate', body: 'FROM node HEALTHCHECK USER 1000' },
  { slug: 'gha-workflow-author', name: 'GitHub Actions Workflow Author', description: 'Writes GitHub Actions workflows.', category: 'ci', tags: ['ci','github-actions'], tools: ['GitHub Actions'], level: 'beginner', body: 'jobs: build matrix strategy' },
];

describe('search.ts', () => {
  it('ranks name exact > name prefix > tag > description > body', () => {
    const r1 = rank('bicep', docs);
    expect(r1[0].slug).toBe('bicep-module-generator');

    const r2 = rank('docker', docs);
    expect(r2[0].slug).toBe('dockerfile-hardener');

    const r3 = rank('workflow', docs);
    expect(r3[0].slug).toBe('gha-workflow-author');
  });

  it('returns empty for no matches', () => {
    expect(rank('nothingatall', docs)).toEqual([]);
  });

  it('returns all docs with score 0 for empty query', () => {
    const r = rank('', docs);
    expect(r.length).toBe(docs.length);
    expect(r.every((x) => x.score === 0)).toBe(true);
  });
});
