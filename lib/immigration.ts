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
  { slug: 'accredited-employer-work-visa', name: 'Accredited Employer Work Visa', category: 'Work', officialUrl: 'https://www.immigration.govt.nz/visas/accredited-employer-work-visa/', summary: 'For people with a full-time job offer from an accredited New Zealand employer.', keyQuestions: ['Who can apply?', 'What job offer is required?', 'How long can I stay?', 'What can I study?', 'Can I support family visas?'] },
  { slug: 'post-study-work-visa', name: 'Post Study Work Visa', category: 'Work', officialUrl: 'https://www.immigration.govt.nz/visas/post-study-work-visa/', summary: 'For eligible people who have completed an acceptable qualification in New Zealand.', keyQuestions: ['Who can apply?', 'How long can I work?', 'What work can I do?', 'When should I apply?', 'Can family come with me?'] },
  { slug: 'specific-purpose-work-visa', name: 'Specific Purpose Work Visa', category: 'Work', officialUrl: 'https://www.immigration.govt.nz/visas/specific-purpose-work-visa/', summary: 'For people coming to New Zealand temporarily to complete an approved specific purpose or event.', keyQuestions: ['Who can apply?', 'What purposes qualify?', 'How long can I stay?', 'What work can I do?', 'What evidence is required?'] },
  { slug: 'religious-worker-work-visa', name: 'Religious Worker Work Visa', category: 'Work', officialUrl: 'https://www.immigration.govt.nz/visas/religious-worker-work-visa/', summary: 'For people with an offer of religious work from an eligible New Zealand religious organisation.', keyQuestions: ['Who can apply?', 'What religious work qualifies?', 'Who can sponsor me?', 'How long can I stay?', 'Can this lead to residence?'] },
  { slug: 'recognised-seasonal-employer-limited-visa', name: 'Recognised Seasonal Employer Limited Visa', category: 'Work', officialUrl: 'https://www.immigration.govt.nz/visas/recognised-seasonal-employer-limited-visa/', summary: 'For eligible seasonal workers coming to New Zealand to work for a Recognised Seasonal Employer in horticulture or viticulture.', keyQuestions: ['Who can apply?', 'Which countries are eligible?', 'How long can I stay?', 'Which employers qualify?', 'What insurance is required?'] },
  { slug: 'supplementary-seasonal-employment-work-visa', name: 'Supplementary Seasonal Employment Work Visa', category: 'Work', officialUrl: 'https://www.immigration.govt.nz/visas/supplementary-seasonal-employment-work-visa/', summary: 'For eligible people already in New Zealand on a student or visitor visa who want approved seasonal horticulture or viticulture work.', keyQuestions: ['Who can apply?', 'How long can I work?', 'Which employers qualify?', 'What seasonal work is allowed?', 'Can I study?'] },
  { slug: 'peak-seasonal-visa', name: 'Peak Seasonal Visa', category: 'Work', officialUrl: 'https://www.immigration.govt.nz/visas/peak-seasonal-visa/', summary: 'For eligible workers with full-time seasonal job offers in occupations on the Peak Seasonal Visa job list.', keyQuestions: ['Who can apply?', 'Which jobs qualify?', 'How long can I stay?', 'How many hours must I work?', 'Can family come with me?'] },
  { slug: 'global-workforce-seasonal-visa', name: 'Global Workforce Seasonal Visa', category: 'Work', officialUrl: 'https://www.immigration.govt.nz/visas/global-workforce-seasonal-visa/', summary: 'For eligible workers in approved Global Workforce Seasonal Visa occupations with an accredited employer.', keyQuestions: ['Who can apply?', 'Which jobs qualify?', 'How long can I work each year?', 'How many seasons are allowed?', 'Can family come with me?'] },

  { slug: 'fee-paying-student-visa', name: 'Fee Paying Student Visa', category: 'Study', officialUrl: 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/', summary: 'For international students paying tuition fees themselves or with approved financial support.', keyQuestions: ['Who can apply?', 'How much money is required?', 'Can I work while studying?', 'How long can I stay?', 'What insurance is required?'] },
  { slug: 'pathway-student-visa', name: 'Pathway Student Visa', category: 'Study', officialUrl: 'https://www.immigration.govt.nz/visas/pathway-student-visa/', summary: 'For international students following an approved pathway of up to three consecutive programmes of study on one visa.', keyQuestions: ['Who can apply?', 'How many courses can I study?', 'How long can I stay?', 'Can I work while studying?', 'Which providers qualify?'] },
  { slug: 'foreign-government-supported-student-visa', name: 'Foreign Government Supported Student Visa', category: 'Study', officialUrl: 'https://www.immigration.govt.nz/visas/foreign-government-supported-student-visa/', summary: 'For students supported by an eligible foreign government scholarship or education arrangement.', keyQuestions: ['Who can apply?', 'What government support is required?', 'How long can I stay?', 'Can I work while studying?', 'What evidence is required?'] },
  { slug: 'nz-government-scholarship-student-visa', name: 'NZ Government Scholarship Student Visa', category: 'Study', officialUrl: 'https://www.immigration.govt.nz/visas/nz-government-scholarship-student-visa/', summary: 'For students funded by an eligible New Zealand Government scholarship administered by MFAT or Education New Zealand.', keyQuestions: ['Who can apply?', 'Which scholarships qualify?', 'How long can I stay?', 'Can I work while studying?', 'What return-home conditions apply?'] },
  { slug: 'exchange-student-visa', name: 'Exchange Student Visa', category: 'Study', officialUrl: 'https://www.immigration.govt.nz/visas/exchange-student-visa/', summary: 'For students accepted into an approved exchange scheme who want to study full-time in New Zealand.', keyQuestions: ['Who can apply?', 'Which exchange schemes qualify?', 'How long can I stay?', 'Can I work?', 'Do I pay tuition fees?'] },

  { slug: 'visitor-visa', name: 'Visitor Visa', category: 'Visit', officialUrl: 'https://www.immigration.govt.nz/visas/visitor-visa/', summary: 'For eligible visitors coming to New Zealand for a temporary stay.', keyQuestions: ['Who can apply?', 'How long can I stay?', 'How much money is required?', 'What evidence is needed?', 'Can I study while visiting?'] },
  { slug: 'parent-and-grandparent-visitor-visa', name: 'Parent and Grandparent Visitor Visa', category: 'Visit', officialUrl: 'https://www.immigration.govt.nz/visas/parent-and-grandparent-visitor-visa/', summary: 'For eligible parents and grandparents visiting children or grandchildren who are New Zealand citizens or residents.', keyQuestions: ['Who can apply?', 'How long can I stay?', 'Who must sponsor me?', 'Can my partner be included?', 'What health requirements apply?'] },
  { slug: 'parent-boost-visitor-visa', name: 'Parent Boost Visitor Visa', category: 'Visit', officialUrl: 'https://www.immigration.govt.nz/visas/parent-boost-visitor-visa/', summary: 'A long-stay temporary visitor visa for eligible parents sponsored by New Zealand citizen or resident children.', keyQuestions: ['Who can apply?', 'How long can I stay?', 'What income or funds are required?', 'What insurance is required?', 'Does this lead to residence?'] },
  { slug: 'guardian-visitor-visa', name: 'Guardian Visitor Visa', category: 'Visit', officialUrl: 'https://www.immigration.govt.nz/visas/guardian-visitor-visa/', summary: 'For an eligible parent or legal guardian who needs to live with and care for a child studying in New Zealand.', keyQuestions: ['Who can apply?', 'How long can I stay?', 'How much money is required?', 'Can I work or study?', 'What evidence is required?'] },
  { slug: 'medical-treatment-visitor-visa', name: 'Medical Treatment Visitor Visa', category: 'Visit', officialUrl: 'https://www.immigration.govt.nz/visas/medical-treatment-visitor-visa/', summary: 'For people travelling to New Zealand for pre-arranged medical treatment or consultation.', keyQuestions: ['Who can apply?', 'What treatment evidence is needed?', 'How long can I stay?', 'Who pays medical costs?', 'Can family be included?'] },
  { slug: 'group-visitor-visa', name: 'Group Visitor Visa', category: 'Visit', officialUrl: 'https://www.immigration.govt.nz/visas/group-visitor-visa/', summary: 'For groups travelling to and visiting New Zealand together for the same purpose.', keyQuestions: ['Who can apply?', 'How does a group application work?', 'How long can we stay?', 'Who submits the application?', 'What does each member need?'] },
  { slug: 'transit-visa', name: 'Transit Visa', category: 'Visit', officialUrl: 'https://www.immigration.govt.nz/visas/transit-visa/', summary: 'For eligible travellers transiting through Auckland International Airport on the way to another country.', keyQuestions: ['Who needs this visa?', 'How long can I transit?', 'Where must I stay?', 'Can family be included?', 'Who is exempt?'] },

  { slug: 'partner-of-a-new-zealander-work-visa', name: 'Partner of a New Zealander Work Visa', category: 'Family', officialUrl: 'https://www.immigration.govt.nz/visas/partner-of-a-new-zealander-work-visa/', summary: 'For eligible partners of New Zealand citizens or residents who want to work in New Zealand.', keyQuestions: ['Who can apply?', 'What relationship evidence is needed?', 'How long can I stay?', 'What work can I do?', 'Can dependent children be included?'] },
  { slug: 'partner-of-a-worker-work-visa', name: 'Partner of a Worker Work Visa', category: 'Family', officialUrl: 'https://www.immigration.govt.nz/visas/partner-of-a-worker-work-visa/', summary: 'For eligible partners of people holding qualifying New Zealand work visas who want to work in New Zealand.', keyQuestions: ['Who can apply?', 'Which work visas can support this?', 'How long can I stay?', 'What work rights apply?', 'What relationship evidence is required?'] },
  { slug: 'partner-of-a-student-work-visa', name: 'Partner of a Student Work Visa', category: 'Family', officialUrl: 'https://www.immigration.govt.nz/visas/partner-of-a-student-work-visa/', summary: 'For eligible partners of students studying qualifying New Zealand qualifications who want to work in New Zealand.', keyQuestions: ['Who can apply?', 'Which qualifications qualify?', 'How long can I stay?', 'Can I work without a job offer?', 'Can I support children to join me?'] },
  { slug: 'partner-of-a-worker-visitor-visa', name: 'Partner of a Worker Visitor Visa', category: 'Family', officialUrl: 'https://www.immigration.govt.nz/visas/partner-of-a-worker-visitor-visa/', summary: 'For eligible partners who want to join someone holding an appropriate New Zealand work visa as a visitor.', keyQuestions: ['Who can apply?', 'How long can I stay?', 'Can I work?', 'Can children be included?', 'What relationship evidence is required?'] },
  { slug: 'partner-of-a-student-visitor-visa', name: 'Partner of a Student Visitor Visa', category: 'Family', officialUrl: 'https://www.immigration.govt.nz/visas/partner-of-a-student-visitor-visa/', summary: 'For eligible partners who want to join someone studying in New Zealand as a visitor.', keyQuestions: ['Who can apply?', 'How long can I stay?', 'Can I work?', 'Can children be included?', 'What relationship evidence is required?'] },
  { slug: 'dependent-child-student-visa', name: 'Dependent Child Student Visa', category: 'Family', officialUrl: 'https://www.immigration.govt.nz/visas/dependent-child-student-visa/', summary: 'For eligible dependent children who need a student visa to study in New Zealand while joining a parent.', keyQuestions: ['Who can apply?', 'How long can the child stay?', 'Can the child attend school?', 'Can older school students work?', 'Which parent visas can support this?'] },
  { slug: 'child-of-a-new-zealander-visitor-visa', name: 'Child of a New Zealander Visitor Visa', category: 'Family', officialUrl: 'https://www.immigration.govt.nz/visas/child-of-a-new-zealander-visitor-visa/', summary: 'For eligible dependent children visiting a parent who is a New Zealand citizen or resident.', keyQuestions: ['Who can apply?', 'How long can the child stay?', 'How much support is required?', 'Can the child study?', 'When is a student visa needed instead?'] },
  { slug: 'parent-resident-visa', name: 'Parent Resident Visa', category: 'Family', officialUrl: 'https://www.immigration.govt.nz/visas/parent-resident-visa/', summary: 'A residence pathway for eligible parents sponsored by an adult child in New Zealand.', keyQuestions: ['Who can apply?', 'How does sponsorship work?', 'What income rules apply?', 'What evidence is needed?', 'How does the selection process work?'] },

  { slug: 'skilled-migrant-category-resident-visa', name: 'Skilled Migrant Category Resident Visa', category: 'Residence', officialUrl: 'https://www.immigration.govt.nz/visas/skilled-migrant-category-resident-visa/', summary: 'A residence pathway for eligible skilled people who meet Immigration New Zealand requirements.', keyQuestions: ['Who can apply?', 'What skilled employment is required?', 'How does the points system work?', 'What evidence is needed?', 'Can family be included?'] },
  { slug: 'straight-to-residence-visa', name: 'Straight to Residence Visa', category: 'Residence', officialUrl: 'https://www.immigration.govt.nz/visas/straight-to-residence-visa/', summary: 'For eligible people working in, or with an offer for, qualifying Green List Tier 1 roles.', keyQuestions: ['Who can apply?', 'Which jobs qualify?', 'What pay requirements apply?', 'What evidence is needed?', 'Can family be included?'] },
  { slug: 'work-to-residence-visa', name: 'Work to Residence Visa', category: 'Residence', officialUrl: 'https://www.immigration.govt.nz/visas/work-to-residence-visa/', summary: 'For eligible people who have completed the required New Zealand work experience in a qualifying Green List Tier 2 job.', keyQuestions: ['Who can apply?', 'What work experience is required?', 'Which Green List jobs qualify?', 'What wage rules apply?', 'Can family be included?'] },
  { slug: 'care-workforce-work-to-residence-visa', name: 'Care Workforce Work to Residence Visa', category: 'Residence', officialUrl: 'https://www.immigration.govt.nz/visas/care-workforce-work-to-residence-visa/', summary: 'A residence pathway for eligible workers with qualifying New Zealand care workforce experience.', keyQuestions: ['Who can apply?', 'Which care jobs qualify?', 'How much work experience is required?', 'What wage rules apply?', 'Can family be included?'] },
  { slug: 'transport-work-to-residence-visa', name: 'Transport Work to Residence Visa', category: 'Residence', officialUrl: 'https://www.immigration.govt.nz/visas/transport-work-to-residence-visa/', summary: 'A residence pathway for eligible workers with qualifying New Zealand transport-sector work experience.', keyQuestions: ['Who can apply?', 'Which transport jobs qualify?', 'How much work experience is required?', 'What wage rules apply?', 'Can family be included?'] },
  { slug: 'active-investor-plus-visa', name: 'Active Investor Plus Visa', category: 'Residence', officialUrl: 'https://www.immigration.govt.nz/visas/active-investor-plus-visa/', summary: 'For eligible investors who can make qualifying investments in New Zealand under the Growth or Balanced investment categories.', keyQuestions: ['Who can apply?', 'How much must I invest?', 'What investments qualify?', 'How long must funds stay invested?', 'When can I apply for permanent residence?'] },
];

export function getVisaDefinition(slug: string) { return visaDefinitions.find((visa) => visa.slug === slug); }

function decodeEntities(value: string) {
  return value.replaceAll('&nbsp;', ' ').replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
}

function cleanText(html: string) {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/\{\{[\s\S]*?\}\}/g, ' ')
    .replace(/\{%[\s\S]*?%\}/g, ' ');
  return decodeEntities(sanitizeHtml(withoutNoise, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim());
}

function textBetween(text: string, start: RegExp, ends: RegExp[]) {
  const match = start.exec(text);
  if (!match) return '';
  const rest = text.slice(match.index + match[0].length);
  let end = rest.length;
  for (const re of ends) { const found = re.exec(rest); if (found && found.index < end) end = found.index; }
  return rest.slice(0, end).trim();
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) return match[1].trim().replace(/\s+/g, ' ');
  }
  return undefined;
}

function normalizeItem(value: string) {
  return value
    .replace(/\{\{[\s\S]*?\}\}/g, ' ')
    .replace(/\{%[\s\S]*?%\}/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[-•\s]+/, '')
    .trim();
}

function isUsefulItem(value: string) {
  if (value.length < 8 || value.length > 360) return false;
  if (/\{\{|\}\}|innerText|ng-|v-for|x-for|item\.|undefined|null/i.test(value)) return false;
  if (/^(step\s*\d+|submit your application|check your application status|how to pay|log in to your account|visa labels and evisas)\b/i.test(value)) return false;
  if (/^(and|or|with an|be with an|a|the)$/i.test(value)) return false;
  if (/\b(?:on|in|at|from|to)\s+(?:a|an|the)\s+(?:by|with|to|from|in|on)\s+(?:a|an|the)?\b/i.test(value)) return false;
  if (/\b(?:a|an)\s+(?:by|with|to|from|in|on)\s+(?:a|an)\b/i.test(value)) return false;
  if (/\b(?:on a by an|on an by a|in a by an|in an by a)\b/i.test(value)) return false;
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;
  return true;
}

function dedupeItems(items: string[]) {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const raw of items) {
    const item = normalizeItem(raw);
    if (!isUsefulItem(item)) continue;
    const key = item.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!key || seen.has(key)) continue;
    if (result.some((existing) => {
      const a = existing.toLowerCase();
      const b = item.toLowerCase();
      return a.length > 24 && b.length > 24 && (a.includes(b) || b.includes(a));
    })) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function sectionHtmlFromAnchor(html: string, anchor: RegExp, maxLength = 18000) {
  const match = anchor.exec(html);
  if (!match) return '';
  const start = match.index;
  const rest = html.slice(start, start + maxLength);
  const headingMatches = [...rest.matchAll(/<h[1-4]\b[^>]*>/gi)];
  if (headingMatches.length > 1) return rest.slice(0, headingMatches[1].index);
  return rest;
}

function bulletsFromHtml(html: string, anchor: RegExp, limit = 12) {
  const section = sectionHtmlFromAnchor(html, anchor);
  if (!section) return [];
  const items = [...section.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((match) => cleanText(match[1]));
  return dedupeItems(items).slice(0, limit);
}

function simpleHash(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) { hash ^= input.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

async function fetchVisaSnapshotUncached(definition: VisaDefinition): Promise<VisaSnapshot> {
  try {
    const response = await fetch(definition.officialUrl, {
      headers: { 'User-Agent': 'WebfitNews Immigration Information Monitor (+https://webfitnews.com/immigration)', Accept: 'text/html,application/xhtml+xml' },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`INZ returned ${response.status}`);

    const html = await response.text();
    const text = cleanText(html);
    const sourceHash = simpleHash(text);

    const lengthOfStay = firstMatch(text, [/Length of stay\s+(?:Up to\s+)?(.{1,90}?)(?=\s+Cost\b)/i, /Visa length\s+(?:up to\s+)?(.{1,90}?)(?=\s+(?:Cost|To apply|This visa)\b)/i]);
    const cost = firstMatch(text, [/Cost\s+(?:From\s+)?(.{1,70}?)(?=\s+Processing time\b)/i]);
    const processingTime = firstMatch(text, [/Processing time\s+(?:80% within\s+)?(.{1,80}?)(?=\s+(?:Residence option|To apply|This visa)\b)/i]);
    const residenceOption = firstMatch(text, [/Residence option\s+(.{1,90}?)(?=\s+To apply you must:)/i]);

    const applyRequirements = bulletsFromHtml(html, /To apply you must/i, 12);
    const visaLetsYou = bulletsFromHtml(html, /This visa lets you/i, 10);
    let documentGuidance = bulletsFromHtml(html, /Gather your documents/i, 14);

    if (!documentGuidance.length) {
      const docsBlock = textBetween(text, /(?:Gather your documents|Documents you need|What you need to apply)/i, [/Submit your application/i, /How to pay/i, /When you arrive/i, /While you are in New Zealand/i]);
      documentGuidance = dedupeItems(docsBlock.split(/(?<=[.!?])\s+(?=[A-Z])/)).slice(0, 10);
    }

    return { name: definition.name, officialUrl: definition.officialUrl, lengthOfStay, cost, processingTime, residenceOption, applyRequirements, visaLetsYou, documentGuidance, sourceText: text.slice(0, 30000), sourceHash, checkedAt: new Date().toISOString(), sourceOk: true };
  } catch {
    return { name: definition.name, officialUrl: definition.officialUrl, applyRequirements: [], visaLetsYou: [], documentGuidance: [], sourceText: '', sourceHash: '', checkedAt: new Date().toISOString(), sourceOk: false };
  }
}

export async function getVisaSnapshot(slug: string) {
  const definition = getVisaDefinition(slug);
  if (!definition) return null;
  const cached = unstable_cache(() => fetchVisaSnapshotUncached(definition), [`inz-visa-${definition.slug}-v3`], { revalidate: 21600, tags: [`inz-visa-${definition.slug}`, 'inz-visas'] });
  return cached();
}
