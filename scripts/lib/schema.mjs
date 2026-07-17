/**
 * Plain-JS mirrors of the zod schema in src/content/config.ts.
 * We can't import astro:content from Node scripts, so we duplicate the
 * shape here — the unit test in test/schema-parity.test.ts checks they
 * stay in sync.
 */

export const CATEGORIES = ['ci', 'iac', 'container', 'k8s', 'security', 'obs', 'release', 'ir', 'finops'];
export const LEVELS = ['beginner', 'intermediate', 'advanced'];
export const PLATFORMS = ['GitHub Copilot', 'Claude', 'Copilot CLI', 'Copilot Cloud Agent'];

function isString(v) { return typeof v === 'string'; }
function isArrayOf(v, pred) { return Array.isArray(v) && v.every(pred); }

/**
 * @returns {{ ok: true } | { ok: false, errors: string[] }}
 */
export function validateMetadata(m) {
  const errors = [];
  if (!isString(m.name) || m.name.length < 2 || m.name.length > 80) errors.push('name must be a 2–80 char string');
  if (!isString(m.description) || m.description.length < 20 || m.description.length > 320) errors.push('description must be a 20–320 char string');
  if (!CATEGORIES.includes(m.category)) errors.push(`category must be one of ${CATEGORIES.join(', ')}`);
  if (!isArrayOf(m.platforms, (p) => PLATFORMS.includes(p)) || m.platforms.length < 1) errors.push(`platforms must be a non-empty array of ${PLATFORMS.join(', ')}`);
  if (m.tools !== undefined && !isArrayOf(m.tools, isString)) errors.push('tools must be an array of strings');
  if (!isArrayOf(m.tags, isString) || m.tags.length < 1) errors.push('tags must be a non-empty array of strings');
  if (!LEVELS.includes(m.level)) errors.push(`level must be one of ${LEVELS.join(', ')}`);
  if (typeof m.estimatedMinutes !== 'number' || m.estimatedMinutes < 5 || m.estimatedMinutes > 240) errors.push('estimatedMinutes must be a number 5–240');
  if (m.collections !== undefined && !isArrayOf(m.collections, isString)) errors.push('collections must be an array of strings');
  if (m.author !== undefined && !isString(m.author)) errors.push('author must be a string');
  if (m.authorUrl !== undefined && !isString(m.authorUrl)) errors.push('authorUrl must be a URL string');
  if (m.version !== undefined && !isString(m.version)) errors.push('version must be a string');
  return errors.length ? { ok: false, errors } : { ok: true };
}

export function validateTrainer(t) {
  const errors = [];
  if (t.learningObjectives !== undefined && !isArrayOf(t.learningObjectives, isString)) errors.push('learningObjectives must be an array of strings');
  if (t.prerequisites !== undefined && !isArrayOf(t.prerequisites, isString)) errors.push('prerequisites must be an array of strings');
  if (t.demoScriptMinutes !== undefined && typeof t.demoScriptMinutes !== 'number') errors.push('demoScriptMinutes must be a number');
  if (t.exercises !== undefined) {
    if (!Array.isArray(t.exercises)) errors.push('exercises must be an array');
    else for (const [i, e] of t.exercises.entries()) {
      if (!isString(e.title)) errors.push(`exercises[${i}].title must be string`);
      if (typeof e.durationMinutes !== 'number') errors.push(`exercises[${i}].durationMinutes must be number`);
      if (!isString(e.summary)) errors.push(`exercises[${i}].summary must be string`);
    }
  }
  if (t.discussionQuestions !== undefined && !isArrayOf(t.discussionQuestions, isString)) errors.push('discussionQuestions must be an array of strings');
  if (t.commonPitfalls !== undefined && !isArrayOf(t.commonPitfalls, isString)) errors.push('commonPitfalls must be an array of strings');
  if (t.slideTalkingPoints !== undefined && !isArrayOf(t.slideTalkingPoints, isString)) errors.push('slideTalkingPoints must be an array of strings');
  return errors.length ? { ok: false, errors } : { ok: true };
}
