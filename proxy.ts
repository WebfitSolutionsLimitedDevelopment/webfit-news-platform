import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getPublicEnv } from './lib/env';

type CookieToSet = { name: string; value: string; options?: any };

function redirectCandidates(pathname: string) {
  if (pathname === '/') return ['/'];
  const withoutTrailing = pathname.replace(/\/+$/, '') || '/';
  const withTrailing = withoutTrailing === '/' ? '/' : `${withoutTrailing}/`;
  return [...new Set([pathname, withoutTrailing, withTrailing])];
}

export async function proxy(request: NextRequest) {
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

  // Historical redirects are database-managed and must execute before route rendering.
  if (!path.startsWith('/admin') && (request.method === 'GET' || request.method === 'HEAD')) {
    const { data: redirectRows } = await supabase
      .from('redirects')
      .select('source_path,destination_path,status_code')
      .eq('is_active', true)
      .in('source_path', redirectCandidates(path))
      .limit(3);

    const redirectRow = redirectRows?.find((row) => row.source_path === path) || redirectRows?.[0];
    if (redirectRow?.destination_path) {
      const destination = new URL(redirectRow.destination_path, request.nextUrl.origin);
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
      .select('is_active')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.is_active) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
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
