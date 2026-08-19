import Link from 'next/link';

type BreakingStory = {
  id: string;
  slug: string;
  title: string;
};

export function BreakingStrip({ stories }: { stories: BreakingStory[] }) {
  if (!stories.length) return null;

  return (
    <div className="breaking-strip" aria-label="Breaking news">
      <div className="shell breaking-inner">
        <strong className="breaking-label">BREAKING</strong>

        <div className="breaking-viewport">
          <div
            className="breaking-track"
            style={{ '--breaking-count': Math.max(stories.length, 1) } as React.CSSProperties}
          >
            <div className="breaking-group">
              {stories.map((story) => (
                <Link
                  className="breaking-item"
                  key={story.id}
                  href={`/${story.slug}/`}
                >
                  <span>{story.title}</span>
                </Link>
              ))}
            </div>

            <div className="breaking-group" aria-hidden="true">
              {stories.map((story) => (
                <Link
                  className="breaking-item"
                  key={`repeat-${story.id}`}
                  href={`/${story.slug}/`}
                  tabIndex={-1}
                >
                  <span>{story.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
