import Link from 'next/link';

/** What a story's byline says under the reporter's name when their profile has no role filled in. */
export const DEFAULT_AUTHOR_TITLE = 'Reporter';

type Author = { name?: string | null; slug?: string | null; title?: string | null; avatar_url?: string | null } | null | undefined;

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]!.toUpperCase()).join('');
}

/**
 * Story byline in the style of NZ news sites: a round photo, the reporter's
 * name (linked to their author page) and their role underneath.
 * No photo: the reporter's initials in a circle. No reporter: the Webfit News newsroom.
 */
export function AuthorByline({ author }: { author: Author }) {
  if (!author?.name) {
    return <div className="author-byline">
      <span className="author-byline-photo is-brand"><img src="/icon-192.png" alt="" width={44} height={44}/></span>
      <span className="author-byline-text">
        <Link href="/about" className="author-byline-name">Webfit News</Link>
        <span className="author-byline-role">Newsroom</span>
      </span>
    </div>;
  }
  const photo = author.avatar_url
    ? <img src={author.avatar_url} alt="" width={44} height={44} loading="eager" decoding="async"/>
    : <span aria-hidden="true">{initials(author.name)}</span>;
  const name = author.slug
    ? <Link href={`/author/${author.slug}`} rel="author" className="author-byline-name">{author.name}</Link>
    : <span className="author-byline-name">{author.name}</span>;
  return <div className="author-byline">
    {author.slug
      ? <Link href={`/author/${author.slug}`} className="author-byline-photo" tabIndex={-1} aria-hidden="true">{photo}</Link>
      : <span className="author-byline-photo">{photo}</span>}
    <span className="author-byline-text">
      {name}
      <span className="author-byline-role">{author.title?.trim() || DEFAULT_AUTHOR_TITLE}</span>
    </span>
  </div>;
}
