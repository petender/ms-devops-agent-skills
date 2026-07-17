/**
 * Client-side fuzzy search + ranking used by FilterBar.
 * Ranks: exact name match > name prefix > tag match > description > body.
 */

export interface SearchDoc {
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  tools: string[];
  level: string;
  body: string;
}

export interface RankedDoc extends SearchDoc {
  score: number;
}

export function rank(query: string, docs: SearchDoc[]): RankedDoc[] {
  const q = query.trim().toLowerCase();
  if (!q) return docs.map((d) => ({ ...d, score: 0 }));

  const terms = q.split(/\s+/).filter(Boolean);

  return docs
    .map((d) => {
      let score = 0;
      const name = d.name.toLowerCase();
      const desc = d.description.toLowerCase();
      const tags = d.tags.map((t) => t.toLowerCase());
      const tools = d.tools.map((t) => t.toLowerCase());
      const body = d.body.toLowerCase();

      for (const t of terms) {
        if (name === t) score += 100;
        else if (name.startsWith(t)) score += 50;
        else if (name.includes(t)) score += 25;
        if (tags.some((tag) => tag === t)) score += 20;
        else if (tags.some((tag) => tag.includes(t))) score += 10;
        if (tools.some((tool) => tool.toLowerCase() === t)) score += 15;
        if (desc.includes(t)) score += 5;
        if (body.includes(t)) score += 1;
      }
      return { ...d, score };
    })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score);
}
