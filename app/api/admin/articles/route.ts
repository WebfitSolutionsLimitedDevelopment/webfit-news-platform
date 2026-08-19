import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '../../../../lib/supabase-server';
import { revalidateEditorialContent } from '../../../../lib/editorial-revalidate';
import { sanitizeArticleHtml } from '../../../../lib/article-html';

const ArticleInput = z.object({
  title: z.string().trim().min(5),
  subtitle: z.string().optional().nullable(),
  slug: z.string().trim().min(3).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().optional().nullable(),
  content_html: z.string().default(''),
  status: z.enum(['draft','in_review','scheduled','published','archived']).default('draft'),
  article_type: z.enum(['news','breaking_news','analysis','opinion','editorial','explainer','feature','interview','community','press_release']).default('news'),
  author_id: z.string().uuid().optional().nullable(),
  featured_media_id: z.string().uuid().optional().nullable(),
  published_at: z.string().datetime().optional().nullable(),
  scheduled_at: z.string().datetime().optional().nullable(),
  is_breaking: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  is_editor_pick: z.boolean().default(false),
  is_homepage_hero: z.boolean().default(false),
  seo_title: z.string().optional().nullable(),
  meta_description: z.string().optional().nullable(),
  canonical_url: z.string().url().optional().nullable().or(z.literal('')),
  social_title: z.string().optional().nullable(),
  social_description: z.string().optional().nullable(),
  category_ids: z.array(z.string().uuid()).default([]),
  primary_category_id: z.string().uuid().optional().nullable(),
  tag_names: z.array(z.string().trim().min(1)).default([]),
});

async function authContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const { data: profile } = await supabase.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle();
  if (!profile?.is_active) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { supabase, user, profile };
}

export async function GET() {
  const ctx = await authContext(); if ('error' in ctx) return ctx.error;
  const { data, error } = await ctx.supabase.from('articles').select('id,title,slug,status,article_type,published_at,updated_at,is_breaking,is_featured,is_editor_pick').order('updated_at',{ascending:false}).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ articles: data });
}

export async function POST(req: Request) {
  const ctx = await authContext(); if ('error' in ctx) return ctx.error;
  const parsed = ArticleInput.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const input = parsed.data;
  if (['published','scheduled'].includes(input.status) && !['super_admin','editor'].includes(ctx.profile.role)) return NextResponse.json({ error: 'Publishing permission required' }, { status: 403 });
  if (input.status === 'scheduled' && !input.scheduled_at) return NextResponse.json({ error: 'A schedule date and time is required.' }, { status: 422 });

  const now = new Date().toISOString();
  const publishedAt = input.status === 'published' ? (input.published_at || now) : input.published_at;
  const { category_ids, primary_category_id, tag_names, ...article } = input;
  const cleanArticle = { ...article, content_html: sanitizeArticleHtml(article.content_html || '') };
  const { data: created, error } = await ctx.supabase.from('articles').insert({ ...cleanArticle, canonical_url: cleanArticle.canonical_url || null, published_at: publishedAt }).select('id,slug,status').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const cats = Array.from(new Set([...category_ids, ...(primary_category_id ? [primary_category_id] : [])]));
  if (cats.length) await ctx.supabase.from('article_categories').insert(cats.map(category_id => ({ article_id: created.id, category_id, is_primary: category_id === primary_category_id })));

  for (const raw of tag_names) {
    const name = raw.trim(); if (!name) continue;
    const slug = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    if (!slug) continue;
    const { data: tag } = await ctx.supabase.from('tags').upsert({ name, slug }, { onConflict: 'slug' }).select('id').single();
    if (tag) await ctx.supabase.from('article_tags').upsert({ article_id: created.id, tag_id: tag.id }, { onConflict: 'article_id,tag_id' });
  }

  await ctx.supabase.from('audit_log').insert({ actor_id: ctx.user.id, action: 'article.create', entity_type: 'article', entity_id: created.id, metadata: { status: input.status } });

  if (input.status === 'published') revalidateEditorialContent(created.slug);

  return NextResponse.json({ article: created }, { status: 201 });
}
