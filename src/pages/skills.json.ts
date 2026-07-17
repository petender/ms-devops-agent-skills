import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const skills = await getCollection('skills');
  const payload = skills.map((s) => ({
    name: s.data.name,
    slug: s.slug,
    description: s.data.description,
    category: s.data.category,
    platforms: s.data.platforms,
    tools: s.data.tools,
    tags: s.data.tags,
    level: s.data.level,
    estimatedMinutes: s.data.estimatedMinutes,
    collections: s.data.collections,
    author: s.data.author,
    version: s.data.version,
    hasAssets: s.data.hasAssets,
    hasScripts: s.data.hasScripts,
    hasTrainerNotes: s.data.hasTrainerNotes,
  }));
  return new Response(JSON.stringify(payload, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
