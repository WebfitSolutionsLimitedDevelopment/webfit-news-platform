export type ConverterCategory = { id: string; name: string };

export type MediaReleaseDraft = {
  title: string;
  slug: string;
  subtitle: string;
  excerpt: string;
  content_html: string;
  seo_title: string;
  meta_description: string;
  social_title: string;
  social_description: string;
  tag_names: string[];
  primary_category_id: string | null;
  category_ids: string[];
  article_type: 'news' | 'breaking_news';
  is_breaking: boolean;
  source_name: string | null;
  release_date: string | null;
  stats: { source_words: number; article_words: number };
  warnings: string[];
};

const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec';
const LABEL_RE = /^(media\s+(release|statement|advisory)|press\s+release|news\s+release|for\s+immediate\s+release|immediate\s+release|embargoed|release|statement|ends?|notes?\s+to\s+(editors?|media)|media\s+contact|contact|issued\s+by)\b[:\s-]*/i;
const CONTACT_RE = /(^|\b)(media\s+contact|communications?\s+contact|press\s+contact|for\s+more\s+information|enquiries|email|phone|mobile|ph)\b/i;
const BOILERPLATE_RE = /^(about\s+(us|the|[A-Z])|background|editor'?s?\s+notes?|notes?\s+to\s+(editors?|media))\b/i;
const ROLE_RE = /\b(minister|mp|chief executive|ceo|chair|director|president|commissioner|mayor|spokesperson|leader|deputy|hon\.?|dr\.?|professor)\b/i;
const URGENT_RE = /\b(breaking|urgent|evacuate|evacuation|lockdown|major incident|state of emergency|immediate danger|shelter in place)\b/i;

const CATEGORY_RULES: Array<{ names: string[]; terms: string[] }> = [
  { names: ['Politics', 'New Zealand Politics', 'Government'], terms: ['government','minister','parliament','cabinet','prime minister','opposition','national party','labour party','act party','green party','new zealand first','beehive'] },
  { names: ['Auckland', 'Auckland News'], terms: ['auckland','tāmaki makaurau','tamaki makaurau','manukau','papakura','waitematā','waitemata','north shore','rodney','howick','mt wellington','mount wellington'] },
  { names: ['Business', 'Economy', 'Business & Economy'], terms: ['business','company','economy','economic','investment','revenue','jobs','employment','inflation','commerce','industry','export','trade','financial'] },
  { names: ['Crime', 'Police', 'Crime & Justice'], terms: ['police','arrest','arrested','charged','court','investigation','offender','homicide','robbery','assault','sentenced','crime'] },
  { names: ['Health', 'Health & Wellbeing'], terms: ['health','hospital','doctor','nurse','patient','medical','medicine','health new zealand','te whatu ora','mental health','insurance'] },
  { names: ['Environment', 'Climate'], terms: ['environment','climate','conservation','waste','recycling','emissions','biodiversity','marine','flood','severe weather'] },
  { names: ['Transport', 'Infrastructure'], terms: ['transport','rail','road','motorway','bus','train','airport','infrastructure','harbour crossing','city rail link'] },
  { names: ['Technology', 'Tech'], terms: ['technology','tech','software','artificial intelligence','cyber','startup','digital','innovation','drone'] },
  { names: ['Education'], terms: ['education','school','student','teacher','university','tertiary','curriculum'] },
  { names: ['Sport', 'Sports'], terms: ['sport','rugby','cricket','football','basketball','match','tournament','team','athlete'] },
  { names: ['Community'], terms: ['community','festival','celebration','cultural','charity','local residents','volunteer'] },
  { names: ['World', 'International'], terms: ['international','global','united nations','australia','india','china','united states','europe','pacific'] },
];

const TAG_TERMS = [
  'Auckland','New Zealand','Government','Parliament','Police','Health','Environment','Climate','Transport','Infrastructure','Technology','Education','Business','Economy','Community','Housing','Immigration','Defence','Trade','Weather','Council','Local Government','Cost of Living','Public Service'
];

function cleanLine(line: string) {
  return line
    .replace(/^\s*[|>]+\s*/, '')
    .replace(/^\s*[-*•]+\s*/, '')
    .replace(/\*\*/g, '')
    .replace(/__+/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value: string) {
  return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function plainText(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function words(value: string) {
  return plainText(value).split(/\s+/).filter(Boolean);
}

function truncate(value: string, max: number) {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const slice = text.slice(0, max + 1);
  const cut = slice.lastIndexOf(' ');
  return `${slice.slice(0, cut > max * 0.65 ? cut : max).replace(/[,:;\s-]+$/,'')}...`;
}

function slugify(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,120).replace(/-$/,'');
}

function findReleaseDate(lines: string[]) {
  const patterns = [
    new RegExp(`\\b(\\d{1,2})\\s+(${MONTHS})\\s+(20\\d{2})\\b`, 'i'),
    new RegExp(`\\b(${MONTHS})\\s+(\\d{1,2}),?\\s+(20\\d{2})\\b`, 'i'),
    /\b(20\d{2})[-\/]([01]?\d)[-\/]([0-3]?\d)\b/,
    /\b([0-3]?\d)[-\/]([01]?\d)[-\/](20\d{2})\b/,
  ];
  for (const line of lines.slice(0, 25)) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) return match[0];
    }
  }
  return null;
}

function headlineScore(line: string, index: number) {
  const count = words(line).length;
  if (line.length < 12 || line.length > 180 || count < 3 || count > 22) return -100;
  if (LABEL_RE.test(line) || CONTACT_RE.test(line)) return -100;
  if (/^https?:|@/.test(line) || /^[\d\s./-]+$/.test(line)) return -100;
  if (new RegExp(`^\\d{1,2}\\s+(${MONTHS})\\s+20\\d{2}$`, 'i').test(line)) return -100;
  let score = 25 - index;
  if (!/[.!?]$/.test(line)) score += 12;
  if (count >= 5 && count <= 14) score += 10;
  if (ROLE_RE.test(line) && count <= 8) score -= 14;
  if (/\b(source|minister for|office of|department of|ministry of)\b/i.test(line)) score -= 8;
  return score;
}

function findHeadline(lines: string[]) {
  const candidates = lines.slice(0, 24).map((line,index)=>({line,index,score:headlineScore(line,index)})).sort((a,b)=>b.score-a.score);
  return candidates[0]?.score > 0 ? candidates[0].line.replace(/^["“]|["”]$/g,'').trim() : null;
}

function findSource(lines: string[], fullText: string) {
  const explicit = lines.slice(0, 30).find(line => /^source\s*:/i.test(line));
  if (explicit) return explicit.replace(/^source\s*:\s*/i,'').trim() || null;

  const organisations = [
    /\b(New Zealand Police|NZ Police)\b/i,
    /\b(Health New Zealand|Te Whatu Ora)\b/i,
    /\b(Auckland Council|Auckland Transport)\b/i,
    /\b(New Zealand Defence Force|NZDF)\b/i,
    /\b(Department of Conservation|DOC)\b/i,
    /\b(Ministry for the Environment)\b/i,
    /\b(Ministry of Business, Innovation and Employment|MBIE)\b/i,
    /\b(Ministry of Foreign Affairs and Trade|MFAT)\b/i,
    /\b(Ministry of Education)\b/i,
    /\b(Ministry of Health)\b/i,
    /\b(Stats NZ)\b/i,
    /\b(Reserve Bank of New Zealand|RBNZ)\b/i,
    /\b(Public Service Association|PSA)\b/i,
  ];
  for (const pattern of organisations) {
    const match = fullText.match(pattern);
    if (match) return match[1];
  }

  const office = lines.slice(0,18).find(line => /^(office of|ministry of|department of|commission|council|association|authority)\b/i.test(line) && line.length < 100);
  if (office) return office;

  const ministerRole = lines.slice(0,12).find(line => /^minister\s+(for|of)\s+/i.test(line) && line.length < 100);
  if (ministerRole) return `Office of the ${ministerRole}`;

  return null;
}

function stripHeaderAndFooter(lines: string[], headline: string | null) {
  let start = 0;
  if (headline) {
    const index = lines.findIndex(line => line === headline);
    if (index >= 0) start = index + 1;
  }
  while (start < lines.length && (LABEL_RE.test(lines[start]) || lines[start].length < 3 || /^[\d\s./-]+$/.test(lines[start]))) start++;

  let end = lines.length;
  for (let i = Math.max(start + 1, 0); i < lines.length; i++) {
    if (CONTACT_RE.test(lines[i]) || /^ends?$/i.test(lines[i]) || BOILERPLATE_RE.test(lines[i])) {
      if (i > Math.max(start + 2, Math.floor(lines.length * 0.45))) { end = i; break; }
    }
  }
  return lines.slice(start, end);
}

function toParagraphs(lines: string[]) {
  const paragraphs: string[] = [];
  let buffer: string[] = [];
  const flush = () => {
    const text = buffer.join(' ').replace(/\s+/g,' ').trim();
    if (text) paragraphs.push(text);
    buffer = [];
  };
  for (const line of lines) {
    if (!line) { flush(); continue; }
    if (LABEL_RE.test(line)) continue;
    if (/^(https?:\/\/|www\.)/i.test(line)) continue;
    buffer.push(line);
    if (/[.!?”"]$/.test(line) && buffer.join(' ').length >= 170) flush();
  }
  flush();
  return paragraphs.filter(p => p.length > 2);
}

function sentenceSummary(paragraphs: string[]) {
  const first = paragraphs.find(p => p.length >= 45) || paragraphs[0] || '';
  return first.replace(/^[-–]+\s*/,'').trim();
}

function titleCaseHeadline(value: string) {
  const text = value.replace(/\s+/g,' ').replace(/[.!]+$/,'').trim();
  if (!text) return text;
  if (text === text.toUpperCase()) return text.toLowerCase().replace(/(^|[.!?]\s+)([a-z])/g,(_,p1,p2)=>p1+p2.toUpperCase());
  return text;
}

function extractTags(text: string, headline: string) {
  const haystack = `${headline} ${text}`;
  const tags: string[] = [];
  const add = (tag: string) => { if (tag && !tags.some(x => x.toLowerCase() === tag.toLowerCase())) tags.push(tag); };

  for (const term of TAG_TERMS) {
    if (new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+')}\\b`,'i').test(haystack)) add(term);
  }

  const sourceLines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);
  for (let i = 0; i < Math.min(sourceLines.length - 1, 16); i++) {
    if (/^(?:Hon\.?\s+)?[A-Z][a-zÀ-ž'’-]+(?:\s+[A-Z][a-zÀ-ž'’-]+){1,3}$/.test(sourceLines[i]) && ROLE_RE.test(sourceLines[i + 1])) {
      add(sourceLines[i].replace(/^Hon\.?\s+/i,''));
    }
  }

  const proper = haystack.match(/\b(?:Hon\.?[ \t]+)?(?:[A-Z][a-zÀ-ž'’-]+(?:[ \t]+|$)){2,5}/g) || [];
  for (const raw of proper) {
    const tag = raw.trim().replace(/[,:;.]+$/,'');
    if (
      tag.length >= 6 &&
      tag.length <= 55 &&
      !/^(Media Release|Press Release|New Zealand Government|The Government)$/i.test(tag) &&
      !/^(Environment|Government|Infrastructure|Technology|Education|Business|Economy|Community|Health|Transport|Police)\b/i.test(tag) &&
      !ROLE_RE.test(tag)
    ) add(tag);
    if (tags.length >= 12) break;
  }

  return tags.slice(0,12);
}

function mapCategories(text: string, categories: ConverterCategory[]) {
  const lower = text.toLowerCase();
  const scored = CATEGORY_RULES.map(rule => {
    const score = rule.terms.reduce((sum,term)=>sum + (lower.includes(term) ? (term.includes(' ') ? 3 : 1) : 0), 0);
    const category = categories.find(c => rule.names.some(name => c.name.toLowerCase() === name.toLowerCase()))
      || categories.find(c => rule.names.some(name => c.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(c.name.toLowerCase())));
    return { category, score };
  }).filter((x): x is { category: ConverterCategory; score: number } => Boolean(x.category) && x.score > 0)
    .sort((a,b)=>b.score-a.score);

  const unique: ConverterCategory[] = [];
  for (const item of scored) if (!unique.some(c => c.id === item.category.id)) unique.push(item.category);
  return { primary: unique[0] || null, secondary: unique.slice(1,4) };
}

function sourceNote(source: string | null) {
  return source ? `<p><strong>Source:</strong> ${escapeHtml(source)}</p>` : '';
}

export function convertMediaRelease(rawText: string, categories: ConverterCategory[] = []): MediaReleaseDraft {
  const normalised = rawText.replace(/\r\n?/g,'\n').replace(/\u00a0/g,' ').replace(/\t/g,' ');
  const linesWithBlanks = normalised.split('\n').map(cleanLine);
  const compactLines = linesWithBlanks.filter(Boolean);
  const releaseDate = findReleaseDate(compactLines);
  const detectedHeadline = findHeadline(compactLines);
  const title = titleCaseHeadline(detectedHeadline || sentenceSummary(toParagraphs(linesWithBlanks)) || 'Untitled news release');
  const source = findSource(compactLines, normalised);

  const bodyLines = stripHeaderAndFooter(linesWithBlanks, detectedHeadline);
  const paragraphs = toParagraphs(bodyLines).filter(p => p !== detectedHeadline);
  const summary = sentenceSummary(paragraphs);
  const bodyHtml = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('\n');
  const contentHtml = `${bodyHtml}${bodyHtml && source ? '\n' : ''}${sourceNote(source)}`.trim();
  const yearMatch = releaseDate?.match(/20\d{2}/)?.[0];
  const slugBase = yearMatch && !title.includes(yearMatch) ? `${title} ${yearMatch}` : title;
  const tags = extractTags(normalised, title);
  const categoryMatch = mapCategories(`${title} ${normalised}`, categories);
  const isBreaking = URGENT_RE.test(`${title} ${summary}`);
  const warnings: string[] = [];

  if (!source) warnings.push('Source organisation was not confidently detected. Check attribution before publishing.');
  if (!releaseDate) warnings.push('Release date was not confidently detected. Check the publication date.');
  if (paragraphs.length < 2) warnings.push('Very little publishable body copy was detected. Review the pasted release.');
  if (isBreaking) warnings.push('Breaking-news language was detected. Confirm urgency manually before publishing.');

  const meta = truncate(summary || title, 155);
  const excerpt = truncate(summary || title, 190);
  const subtitle = truncate(summary || title, 230);
  const socialDescription = truncate(summary || title, 200);
  const seoTitle = truncate(title, 60);

  return {
    title,
    slug: slugify(slugBase),
    subtitle,
    excerpt,
    content_html: contentHtml,
    seo_title: seoTitle,
    meta_description: meta,
    social_title: truncate(title, 90),
    social_description: socialDescription,
    tag_names: tags,
    primary_category_id: categoryMatch.primary?.id || null,
    category_ids: categoryMatch.secondary.map(c => c.id),
    article_type: isBreaking ? 'breaking_news' : 'news',
    is_breaking: isBreaking,
    source_name: source,
    release_date: releaseDate,
    stats: { source_words: words(normalised).length, article_words: words(contentHtml).length },
    warnings,
  };
}
