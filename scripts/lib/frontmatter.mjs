/**
 * Ultra-light YAML frontmatter parser.
 * Only supports: string scalars (bare/quoted), numbers, booleans, and
 * simple flow-style arrays like [a, b, c]. Enough for our SKILL.md and
 * trainer.md needs.
 *
 * Also supports block-style lists (`- foo`) at indent 0 under a key, and
 * block-style maps for the exercises[] entries in trainer.md.
 */

/**
 * @param {string} raw
 * @returns {{ data: Record<string, any>, body: string }}
 */
export function parseFrontmatter(raw) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!m) return { data: {}, body: raw };
  const yaml = m[1];
  const body = raw.slice(m[0].length);
  return { data: parseYaml(yaml), body };
}

function parseScalar(v) {
  const trimmed = v.trim();
  if (trimmed === '') return '';
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null' || trimmed === '~') return null;
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);
  // Quoted string
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  // Flow-style array
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    return splitFlowList(inner).map((x) => parseScalar(x));
  }
  return trimmed;
}

function splitFlowList(s) {
  const out = [];
  let buf = '';
  let depth = 0;
  let quote = null;
  for (const ch of s) {
    if (quote) {
      buf += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; buf += ch; continue; }
    if (ch === '[' || ch === '{') { depth++; buf += ch; continue; }
    if (ch === ']' || ch === '}') { depth--; buf += ch; continue; }
    if (ch === ',' && depth === 0) { out.push(buf.trim()); buf = ''; continue; }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function indentOf(line) {
  const m = line.match(/^ */);
  return m ? m[0].length : 0;
}

/**
 * Parse a YAML subset that supports:
 *   key: scalar
 *   key: [flow, list]
 *   key:
 *     - item
 *     - item
 *   key:
 *     - subkey: v
 *       other: v
 */
function parseYaml(yaml) {
  const lines = yaml.split('\n').filter((l) => !/^\s*#/.test(l));
  const result = {};
  let i = 0;

  function readBlockList(baseIndent) {
    const items = [];
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === '') { i++; continue; }
      const ind = indentOf(line);
      if (ind < baseIndent) return items;
      if (ind === baseIndent && line.trim().startsWith('- ')) {
        const first = line.trim().slice(2);
        // Nested map item: "- key: value"
        if (/^[A-Za-z_][\w-]*\s*:/.test(first)) {
          const obj = {};
          const [k, ...rest] = first.split(':');
          const v = rest.join(':').trim();
          if (v) obj[k.trim()] = parseScalar(v);
          i++;
          // Continue with sibling keys at (baseIndent + 2)
          const nested = baseIndent + 2;
          while (i < lines.length) {
            const nl = lines[i];
            if (nl.trim() === '') { i++; continue; }
            const ni = indentOf(nl);
            if (ni < nested) break;
            if (ni === nested && !nl.trim().startsWith('- ')) {
              const nm = nl.trim().match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
              if (!nm) { i++; continue; }
              obj[nm[1]] = parseScalar(nm[2]);
              i++;
              continue;
            }
            break;
          }
          items.push(obj);
          continue;
        }
        items.push(parseScalar(first));
        i++;
        continue;
      }
      return items;
    }
    return items;
  }

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i++; continue; }
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!m) { i++; continue; }
    const key = m[1];
    const val = m[2];
    if (val === '') {
      i++;
      // Read block list at greater indent.
      // Determine block indent from next non-empty line.
      let peek = i;
      while (peek < lines.length && lines[peek].trim() === '') peek++;
      if (peek >= lines.length) { result[key] = null; continue; }
      const childIndent = indentOf(lines[peek]);
      if (childIndent > 0 && lines[peek].trim().startsWith('- ')) {
        result[key] = readBlockList(childIndent);
      } else {
        result[key] = null;
      }
    } else {
      result[key] = parseScalar(val);
      i++;
    }
  }

  return result;
}
