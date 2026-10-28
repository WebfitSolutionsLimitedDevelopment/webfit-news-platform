import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getPublicEnv } from './lib/env';

type CookieToSet = { name: string; value: string; options?: any };

// Every other host that serves this site redirects to the one canonical host,
// so Google never sees two copies of a page.
const LEGACY_HOSTS = new Set(['webfitnews.co.nz', 'www.webfitnews.co.nz', 'www.webfitnews.com']);
const CANONICAL_HOST = 'webfitnews.com';

function redirectCandidates(pathname: string, search = '') {
  const withoutTrailing = pathname === '/' ? '/' : (pathname.replace(/\/+$/, '') || '/');
  const withTrailing = withoutTrailing === '/' ? '/' : `${withoutTrailing}/`;
  const pathCandidates = [...new Set([pathname, withoutTrailing, withTrailing])];

  if (!search) return pathCandidates;

  const exactWithQuery = `${pathname}${search}`;
  const normalizedWithQuery = pathCandidates.map((candidate) => `${candidate}${search}`);
  return [...new Set([exactWithQuery, ...normalizedWithQuery, ...pathCandidates])];
}

/**
 * Pattern fixes for URLs that would otherwise 404:
 * - links copied from social posts often carry invisible characters
 *   (word joiner, object-replacement, zero-width space) after the slug;
 * - WordPress nested category URLs (/category/news/new-zealand/page/3) map to
 *   our flat sections (/category/new-zealand/page/3).
 */
const INVISIBLE_CHARS = /[\u200B-\u200D\u2060\uFEFF\uFFFC]/g;
function legacyPathFix(pathname: string): string | null {
  let decoded = pathname;
  try { decoded = decodeURIComponent(pathname); } catch { return null; }
  const cleaned = decoded.replace(INVISIBLE_CHARS, '').replace(/\s+$/, '');
  if (cleaned !== decoded && cleaned.length > 1) return encodeURI(cleaned);

  const segs = pathname.split('/').filter(Boolean);
  if (segs[0] === 'category' && segs.length >= 3) {
    const pageIndex = segs.indexOf('page');
    const catSegs = pageIndex > 0 ? segs.slice(1, pageIndex) : segs.slice(1);
    if (catSegs.length >= 2) {
      const pageNumber = pageIndex > 0 ? segs[pageIndex + 1] : undefined;
      return `/category/${catSegs[catSegs.length - 1]}${pageNumber && /^\d+$/.test(pageNumber) && pageNumber !== '1' ? `/page/${pageNumber}` : ''}`;
    }
  }
  return null;
}

type RedirectRow = { source_path: string; destination_path: string; status_code: number | null };

// The redirect table (about 750 old WordPress URLs) is loaded once and reused
// for five minutes, instead of a database query on every single page view.
const REDIRECT_TTL_MS = 5 * 60 * 1000;
let redirectCache: { rows: RedirectRow[]; loadedAt: number } | null = null;

/** Reporters (submit stories for approval) and the CMS pages open to them. Keep in step with lib/admin-auth.ts. */
const WRITER_ROLES = new Set(['contributor', 'journalist']);
const WRITER_PATHS = /^\/admin\/(articles|media)(\/|$)/;

async function loadRedirects(supabase: any): Promise<RedirectRow[]> {
  if (redirectCache && Date.now() - redirectCache.loadedAt < REDIRECT_TTL_MS) return redirectCache.rows;
  const { data, error } = await supabase
    .from('redirects')
    .select('source_path,destination_path,status_code')
    .eq('is_active', true)
    .limit(10000);
  if (error || !data) return redirectCache?.rows || [];
  redirectCache = { rows: data as RedirectRow[], loadedAt: Date.now() };
  return redirectCache.rows;
}

export async function proxy(request: NextRequest) {
  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase();

  // Preserve every historical path/query while moving legacy .co.nz traffic
  // onto the canonical production host. This runs before any database lookup.
  if (LEGACY_HOSTS.has(host) && (request.method === 'GET' || request.method === 'HEAD')) {
    const destination = request.nextUrl.clone();
    destination.protocol = 'https:';
    destination.host = CANONICAL_HOST;
    destination.port = '';
    // Drop the WordPress-era trailing slash in the same hop, instead of a second redirect.
    if (destination.pathname.length > 1) destination.pathname = destination.pathname.replace(/\/+$/, '') || '/';
    return NextResponse.redirect(destination, 308);
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    const fixed = legacyPathFix(request.nextUrl.pathname);
    if (fixed && fixed !== request.nextUrl.pathname) {
      const destination = request.nextUrl.clone();
      destination.pathname = fixed;
      return NextResponse.redirect(destination, 308);
    }
  }

  let response = NextResponse.next({ request });
  const { supabaseUrl, supabasePublishableKey } = getPublicEnv();
  const supabase = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const path = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  // Historical redirects are database-managed and must execute before route rendering.
  // Query-string sources such as legacy WordPress /?p=123 URLs are matched first.
  if (!path.startsWith('/admin') && (request.method === 'GET' || request.method === 'HEAD')) {
    const candidates = redirectCandidates(path, search);
    const exactSource = `${path}${search}`;

    const redirectRows = (await loadRedirects(supabase)).filter((row) => candidates.includes(row.source_path));

    const redirectRow =
      redirectRows?.find((row) => row.source_path === exactSource) ||
      redirectRows?.find((row) => row.source_path === path) ||
      redirectRows?.find((row) => candidates.includes(row.source_path));
    if (redirectRow?.destination_path) {
      const destination = new URL(redirectRow.destination_path, request.nextUrl.origin);
      // Stored WordPress destinations end in "/", which would trigger a second redirect.
      if (destination.origin === request.nextUrl.origin && destination.pathname.length > 1) {
        destination.pathname = destination.pathname.replace(/\/+$/, '') || '/';
      }
      const status = [301, 302, 307, 308].includes(Number(redirectRow.status_code))
        ? Number(redirectRow.status_code)
        : 301;
      return NextResponse.redirect(destination, status);
    }
  }

  if (!path.startsWith('/admin')) return response;

  const { data: { user } } = await supabase.auth.getUser();

  if (path !== '/admin/login' && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  // Do not create a login loop for authenticated but inactive users.
  if (path === '/admin/login' && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active,role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.is_active) {
      const url = request.nextUrl.clone();
      url.pathname = WRITER_ROLES.has(profile.role) ? '/admin/articles' : '/admin';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  // Outside reporters only get their own stories and the image library.
  if (user && path !== '/admin/login' && !WRITER_PATHS.test(path)) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile && WRITER_ROLES.has(profile.role)) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/articles';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|news-sitemap.xml|rss.xml|.*\\..*).*)',
  ],
};
