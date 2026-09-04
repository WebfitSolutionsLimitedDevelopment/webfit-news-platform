import { NextResponse } from 'next/server';
import { getArticleBySlug, resolveInlineArticleMedia } from '../../../../lib/news';

// Public, unauthenticated endpoint used by the iOS/Android apps' native
// article reader and offline "Saved articles" feature.
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const article: any = await getArticleBySlug(slug);
    if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const contentHtml = await resolveInlineArticleMedia(article.content_html || '');

    return NextResponse.json({
      article: {
        id: article.id,
        title: article.title,
        subtitle: article.subtitle || null,
        slug: article.slug,
        excerpt: article.excerpt,
        content_html: contentHtml,
        published_at: article.published_at,
        article_type: article.article_type,
        image: article.media?.public_url || null,
        image_alt: article.media?.alt_text || null,
        author_name: article.author?.name || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load article' }, { status: 500 });
  }
}
