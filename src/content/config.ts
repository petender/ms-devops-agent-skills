import { defineCollection, z } from 'astro:content';

export const CATEGORIES = [
  'ci',
  'iac',
  'container',
  'k8s',
  'security',
  'obs',
  'release',
  'ir',
  'finops',
] as const;

export const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  ci: 'CI / Pipelines',
  iac: 'Infrastructure as Code',
  container: 'Containers',
  k8s: 'Kubernetes',
  security: 'Security / DevSecOps',
  obs: 'Observability',
  release: 'Release',
  ir: 'Incident Response',
  finops: 'FinOps',
};

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
// Every skill ships a single portable SKILL.md per the Agent Skills open
// standard (agentskills.io). Portal metadata still records the clients we've
// verified so learners know which agents are known to load the skill.
export const PLATFORMS = ['GitHub Copilot', 'Claude', 'Copilot CLI', 'Copilot Cloud Agent'] as const;

const skills = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string().min(2).max(80),
    description: z.string().min(20).max(320),
    category: z.enum(CATEGORIES),
    platforms: z.array(z.enum(PLATFORMS)).min(1),
    tools: z.array(z.string()).default([]),
    tags: z.array(z.string()).min(1),
    level: z.enum(LEVELS),
    estimatedMinutes: z.number().int().min(5).max(240),
    collections: z.array(z.string()).default([]),
    author: z.string().default('DevOps Community'),
    authorUrl: z.string().url().optional(),
    version: z.string().default('1.0.0'),
    hasAssets: z.boolean().default(false),
    hasScripts: z.boolean().default(false),
    hasTrainerNotes: z.boolean().default(false),
    // Raw SKILL.md body (frontmatter stripped) — embedded by importer.
    // A single file per skill; loaded natively by both Copilot and Claude.
    body: z.string(),
    // Trainer notes (optional).
    trainer: z
      .object({
        learningObjectives: z.array(z.string()).default([]),
        prerequisites: z.array(z.string()).default([]),
        demoScriptMinutes: z.number().int().min(0).max(180).default(0),
        exercises: z
          .array(
            z.object({
              title: z.string(),
              durationMinutes: z.number().int().min(0).max(180),
              summary: z.string(),
            })
          )
          .default([]),
        discussionQuestions: z.array(z.string()).default([]),
        commonPitfalls: z.array(z.string()).default([]),
        slideTalkingPoints: z.array(z.string()).default([]),
      })
      .optional(),
  }),
});

export const collections = { skills };
