import sanitizeHtml from 'sanitize-html';
import { unstable_cache } from 'next/cache';

export type VisaCategory = 'Work' | 'Study' | 'Visit' | 'Residence' | 'Family';

export type VisaDefinition = {
  slug: string;
  name: string;
  category: VisaCategory;
  officialUrl: string;
  summary: string;
  keyQuestions: string[];
};

export type VisaSnapshot = {
  name: string;
  officialUrl: string;
  lengthOfStay?: string;
  cost?: string;
  processingTime?: string;
  residenceOption?: string;
  applyRequirements: string[];
  visaLetsYou: string[];
  documentGuidance: string[];
  sourceText: string;
  sourceHash: string;
  checkedAt: string;
  sourceOk: boolean;
};

export const visaDefinitions: VisaDefinition[] = [
  {
    slug: 'accredited-employer-work-visa',
    name: 'Accredited Employer Work Visa',
    category: 'Work',
    officialUrl: 'https://www.immigration.govt.nz/visas/accredited-employer-work-visa/',
    summary: 'For people with a full-time job offer from an accredited New Zealand employer.',
    keyQuestions: ['Who can apply?', 'What job offer is required?', 'How long can I stay?', 'What can I study?', 'Can I support family visas?'],
  },
  {
    slug: 'post-study-work-visa',
    name: 'Post Study Work Visa',
    category: 'Work',
    officialUrl: 'https://www.immigration.govt.nz/visas/post-study-work-visa/',
    summary: 'For eligible people who have completed an acceptable qualification in New Zealand.',
    keyQuestions: ['Who can apply?', 'How long can I work?', 'What work can I do?', 'When should I apply?', 'Can family come with me?'],
  },
  {
    slug: 'fee-paying-student-visa',
    name: 'Fee Paying Student Visa',
    category: 'Study',
    officialUrl: 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/',
    summary: 'For international students paying tuition fees themselves or with approved financial support.',
    keyQuestions: ['Who can apply?', 'How much money is required?', 'Can I work while studying?', 'How long can I stay?', 'What insurance is required?'],
  },
  {
    slug: 'visitor-visa',
    name: 'Visitor Visa',
    category: 'Visit',
    officialUrl: 'https://www.immigration.govt.nz/visas/visitor-visa/',
    summary: 'For eligible visitors coming to New Zealand for a temporary stay.',
    keyQuestions: ['Who can apply?', 'How long can I stay?', 'How much money is required?', 'What evidence is needed?', 'Can I study while visiting?'],
  },
  {
    slug: 'partner-of-a-new-zealander-work-visa',
    name: 'Partner of a New Zealander Work Visa',
    category: 'Family',
    officialUrl: 'https://www.immigration.govt.nz/visas/partner-of-a-new-zealander-work-visa/',
    summary: 'For eligible partners of New Zealand citizens or residents who want to work in New Zealand.',
    keyQuestions: ['Who can apply?', 'What relationship evidence is needed?', 'How long can I stay?', 'What work can I do?', 'Can dependent children be included?'],
  },
  {
    slug: 'skilled-migrant-category-resident-visa',
    name: 'Skilled Migrant Category Resident Visa',
    category: 'Residence',
    officialUrl: 'https://www.immigration.govt.nz/visas/skilled-migrant-category-resident-visa/',
    summary: 'A residence pathway for eligible skilled people who meet Immigration New Zealand requirements.',
    keyQuestions: ['Who can apply?', 'What skilled employment is required?', 'How does the points system work?', 'What evidence is needed?', 'Can family be included?'],
  },
  {
    slug: 'straight-to-residence-visa',
    name: 'Straight to Residence Visa',
    category: 'Residence',
    officialUrl: 'https://www.immigration.govt.nz/visas/straight-to-residence-visa/',
    summary: 'For eligible people working in, or with an offer for, qualifying Green List Tier 1 roles.',
    keyQuestions: ['Who can apply?', 'Which jobs qualify?', 'What pay requirements apply?', 'What evidence is needed?', 'Can family be included?'],
  },
  {
    slug: 'parent-resident-visa',
    name: 'Parent Resident Visa',
    category: 'Family',
    officialUrl: 'https://www.immigration.govt.nz/visas/parent-resident-visa/',
    summary: 'A residence pathway for eligible parents sponsored by an adult child in New Zealand.',
    keyQuestions: ['Who can apply?', 'How does sponsorship work?', 'What income rules apply?', 'What evidence is needed?', 'How does the selection process work?'],
  },
];

export function getVisaDefinition(slug: string) {
  return visaDefinitions.find((visa) => visa.slug === slug);
}

function decodeEntities(value: string) {
  return value
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function cleanText(html: string) {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');
  return decodeEntities(
    sanitizeHtml(withoutNoise, { allowedTags: [], allowedAttributes: {} })
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function textBetween(text: string, start: RegExp, ends: RegExp[]) {
  const match = start.exec(text);
  if (!match) return '';
  const rest = text.slice(match.index + match[0].length);
  let end = rest.length;
  for (const re of ends) {
    const found = re.exec(rest);
    if (found && found.index < end) end = found.index;
  }
  return rest.slice(0, end).trim();
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) return match[1].trim().replace(/\s+/g, ' ');
  }
  return undefined;
}

function bulletsFromHtml(html: string, anchor: RegExp, limit = 12) {
  const anchorMatch = anchor.exec(html);
  if (!anchorMatch) return [];
  const slice = html.slice(anchorMatch.index, anchorMatch.index + 16000);
  const items = [...slice.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => cleanText(match[1]))
    .filter((item) => item.length > 2 && item.length < 500);
  return [...new Set(items)].slice(0, limit);
}

function simpleHash(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

async function fetchVisaSnapshotUncached(definition: VisaDefinition): Promise<VisaSnapshot> {
  try {
    const response = await fetch(definition.officialUrl, {
      headers: {
        'User-Agent': 'WebfitNews Immigration Information Monitor (+https://webfitnews.com/immigration)',
        Accept: 'text/html,application/xhtml+xml',
      },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`INZ returned ${response.status}`);

    const html = await response.text();
    const text = cleanText(html);
    const sourceHash = simpleHash(text);

    const lengthOfStay = firstMatch(text, [
      /Length of stay\s+(?:Up to\s+)?(.{1,90}?)(?=\s+Cost\b)/i,
      /Visa length\s+(?:up to\s+)?(.{1,90}?)(?=\s+(?:Cost|To apply|This visa)\b)/i,
    ]);
    const cost = firstMatch(text, [/Cost\s+(?:From\s+)?(.{1,70}?)(?=\s+Processing time\b)/i]);
    const processingTime = firstMatch(text, [/Processing time\s+(?:80% within\s+)?(.{1,80}?)(?=\s+(?:Residence option|To apply|This visa)\b)/i]);
    const residenceOption = firstMatch(text, [/Residence option\s+(.{1,90}?)(?=\s+To apply you must:)/i]);

    const applyRequirements = bulletsFromHtml(html, /To apply you must/i, 12);
    const visaLetsYou = bulletsFromHtml(html, /This visa lets you/i, 12);
    let documentGuidance = bulletsFromHtml(html, /Gather your documents/i, 16);

    if (!documentGuidance.length) {
      const docsBlock = textBetween(
        text,
        /(?:Gather your documents|Documents you need|What you need to apply)/i,
        [/Submit your application/i, /How to pay/i, /When you arrive/i, /While you are in New Zealand/i],
      );
      documentGuidance = docsBlock
        .split(/(?<=[.!?])\s+(?=[A-Z])/)
        .map((item) => item.trim())
        .filter((item) => item.length > 20 && item.length < 450)
        .slice(0, 10);
    }

    return {
      name: definition.name,
      officialUrl: definition.officialUrl,
      lengthOfStay,
      cost,
      processingTime,
      residenceOption,
      applyRequirements,
      visaLetsYou,
      documentGuidance,
      sourceText: text.slice(0, 30000),
      sourceHash,
      checkedAt: new Date().toISOString(),
      sourceOk: true,
    };
  } catch {
    return {
      name: definition.name,
      officialUrl: definition.officialUrl,
      applyRequirements: [],
      visaLetsYou: [],
      documentGuidance: [],
      sourceText: '',
      sourceHash: '',
      checkedAt: new Date().toISOString(),
      sourceOk: false,
    };
  }
}

export async function getVisaSnapshot(slug: string) {
  const definition = getVisaDefinition(slug);
  if (!definition) return null;

  const cached = unstable_cache(
    () => fetchVisaSnapshotUncached(definition),
    [`inz-visa-${definition.slug}`],
    { revalidate: 21600, tags: [`inz-visa-${definition.slug}`, 'inz-visas'] },
  );

  return cached();
}
