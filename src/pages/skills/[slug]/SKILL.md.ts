import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';

export const getStaticPaths: GetStaticPaths = async () => {
  const skills = await getCollection('skills');
  return skills.map((s) => ({ params: { slug: s.slug }, props: { skill: s } }));
};

export const GET: APIRoute = async ({ props }) => {
  const skill = (props as any).skill;
  const d = skill.data;
  const slug = skill.slug;
  const fm = `---\nname: ${slug}\ndescription: ${JSON.stringify(d.description)}\n---\n\n`;
  return new Response(fm + d.body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.SKILL.md"`,
    },
  });
};
