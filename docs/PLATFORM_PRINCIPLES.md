# Webfit News platform principles

1. Webfit News is a first-party publishing platform. New stories are created, edited, scheduled and published from `/admin`.
2. Supabase is the permanent database, authentication and media-storage layer.
3. Next.js is the permanent public website and newsroom application layer.
4. The historical CMS is only a one-time archive source. It must not be required for normal publishing, reads, media delivery, search, homepage curation, advertising or authentication.
5. Historical source IDs may be retained only as provenance and migration audit fields.
6. After archive verification and DNS cutover, legacy import tools should be disabled or removed.
7. Public URLs are owned by Webfit News. URL continuity and redirects are treated as editorial and SEO records, not as CMS-specific behaviour.
