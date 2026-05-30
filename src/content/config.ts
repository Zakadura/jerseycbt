import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string().max(70),
    description: z.string().max(160),
    date: z.date(),
    hero: image().optional(),
    tags: z.array(z.string()).default([]),
    target_keyword: z.string(),
    draft: z.boolean().default(false),
  }),
});

const conditions = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    condition: z.string(),
    description: z.string().max(160),
    target_keyword: z.string(),
    sessions_typical: z.string(),
    hero: image().optional(),
    symptoms: z.array(z.string()).min(3).max(8),
    resources: z.array(z.object({
      label: z.string(),
      url: z.string().url(),
    })).min(1),
    draft: z.boolean().default(false),
    credibility: z.enum(['cbt', 'cat', 'none']).default('cbt'),
    seoTitle: z.string().max(60).optional(),
  }),
});

export const collections = { articles, conditions };
