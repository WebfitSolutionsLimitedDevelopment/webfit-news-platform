import { ImageResponse } from 'next/og';
import { getArticleBySlug } from '@/lib/news';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return new Response('Not found', { status: 404 });
  }

  const image = article.media?.public_url || null;
  const title = article.social_title || article.title;
  const description =
    article.social_description ||
    article.meta_description ||
    article.excerpt ||
    '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          position: 'relative',
          background: '#101418',
          overflow: 'hidden',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        {image ? (
          <img
            src={image}
            alt=""
            width="1200"
            height="630"
            style={{
              position: 'absolute',
              inset: 0,
              width: '1200px',
              height: '630px',
              objectFit: 'cover',
            }}
          />
        ) : null}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background:
              'linear-gradient(180deg, rgba(8,12,16,.10) 0%, rgba(8,12,16,.30) 42%, rgba(8,12,16,.92) 100%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: '54px',
            right: '54px',
            bottom: '48px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '18px',
              fontSize: '24px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '.02em',
            }}
          >
            Webfit News
          </div>

          <div
            style={{
              display: 'flex',
              maxWidth: '1080px',
              fontSize: title.length > 82 ? '46px' : '54px',
              lineHeight: 1.04,
              fontWeight: 850,
              color: '#ffffff',
              textShadow: '0 2px 10px rgba(0,0,0,.45)',
            }}
          >
            {title}
          </div>

          {description ? (
            <div
              style={{
                display: 'flex',
                maxWidth: '1030px',
                marginTop: '18px',
                fontSize: '24px',
                lineHeight: 1.25,
                color: 'rgba(255,255,255,.92)',
              }}
            >
              {description.slice(0, 155)}
            </div>
          ) : null}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
