import sanitizeHtml from 'sanitize-html';
import { unstable_cache } from 'next/cache';

export type PracticalFact = {
  label: string;
  value: string;
  note?: string;
  sourceUrl: string;
};

export type PracticalGuidance = {
  title: string;
  intro: string;
  facts: PracticalFact[];
  checkedAt: string;
  sourceOk: boolean;
};

const STUDENT_URL = 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/';
const POST_STUDY_URL = 'https://www.immigration.govt.nz/visas/post-study-work-visa/';
const POST_STUDY_LENGTH_URL = 'https://www.immigration.govt.nz/work/requirements-for-work-visas/how-long-you-can-work-on-work-visas/how-long-you-can-stay-on-a-post-study-work-visa/';
const MIN_WAGE_URL = 'https://www.employment.govt.nz/pay-and-hours/pay-and-wages/minimum-wage/minimum-wage-rates-and-types';

function clean(html: string) {
  return sanitizeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/\{\{[\s\S]*?\}\}/g, ' '),
    { allowedTags: [], allowedAttributes: {} },
  ).replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

async function fetchOfficial(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'WebfitNews Immigration Information Monitor (+https://webfitnews.com/immigration)',
      Accept: 'text/html,application/xhtml+xml',
    },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Official source returned ${response.status}`);
  return clean(await response.text());
}

function match(text: string, pattern: RegExp) {
  const found = pattern.exec(text)?.[1];
  return found?.replace(/\s+/g, ' ').trim();
}

async function fetchStudentGuidance(): Promise<PracticalGuidance> {
  try {
    const [student, minimumWage] = await Promise.all([fetchOfficial(STUDENT_URL), fetchOfficial(MIN_WAGE_URL)]);
    const weeklyHours = match(student, /work(?:\s+part-time)?\s+up to\s+(\d{1,2})\s+hours a week/i) || '25';
    const adultRate = match(minimumWage, /Adult\s+\$?([0-9]+\.[0-9]{2})/i);
    const effectiveDate = match(minimumWage, /effective from\s+([^\.]{4,40})\./i);

    return {
      title: 'Work while studying in New Zealand',
      intro: 'Key practical information from Immigration New Zealand and Employment New Zealand. Your actual work rights are the conditions printed on your visa.',
      facts: [
        {
          label: 'Work while studying',
          value: `Up to ${weeklyHours} hours a week`,
          note: 'Eligible student visa holders may have part-time work rights. Always check the conditions on your own visa.',
          sourceUrl: STUDENT_URL,
        },
        {
          label: 'Scheduled holidays',
          value: 'Full-time work may be allowed',
          note: 'This depends on your course, scheduled breaks and the work conditions granted on your student visa.',
          sourceUrl: STUDENT_URL,
        },
        {
          label: 'Adult minimum wage',
          value: adultRate ? `NZD $${adultRate} per hour` : 'Check current official rate',
          note: effectiveDate ? `Official rate effective from ${effectiveDate}. Before tax.` : 'Minimum wage rates are reviewed by the New Zealand Government.',
          sourceUrl: MIN_WAGE_URL,
        },
        {
          label: 'After study',
          value: 'Post Study Work Visa may be available',
          note: 'Eligibility and work conditions depend on the qualification you complete. Open the Post Study Work Visa guide for current details.',
          sourceUrl: POST_STUDY_URL,
        },
      ],
      checkedAt: new Date().toISOString(),
      sourceOk: true,
    };
  } catch {
    return {
      title: 'Work while studying in New Zealand',
      intro: 'Official practical information could not be refreshed safely during this check.',
      facts: [],
      checkedAt: new Date().toISOString(),
      sourceOk: false,
    };
  }
}

async function fetchPostStudyGuidance(): Promise<PracticalGuidance> {
  try {
    const [postStudy, lengthPage] = await Promise.all([fetchOfficial(POST_STUDY_URL), fetchOfficial(POST_STUDY_LENGTH_URL)]);
    const maxYears = match(postStudy, /stay and work in New Zealand for up to\s+(\d+)\s+years/i) || '3';
    const mastersYears = match(lengthPage, /Master[^\.]{0,120}?work in New Zealand for\s+(\d+)\s+years/i) || '3';

    return {
      title: 'After you finish your study',
      intro: 'A practical summary of the current Post Study Work Visa pathway. The exact visa length and work conditions depend on the qualification completed in New Zealand.',
      facts: [
        {
          label: 'Maximum stay',
          value: `Up to ${maxYears} years`,
          note: 'The visa length depends on your qualification and study duration.',
          sourceUrl: POST_STUDY_URL,
        },
        {
          label: 'Master’s or doctoral study',
          value: `Up to ${mastersYears} years`,
          note: 'Immigration New Zealand states this applies where the qualifying study requirements, including study duration, are met.',
          sourceUrl: POST_STUDY_LENGTH_URL,
        },
        {
          label: 'Degree level 7 or higher',
          value: 'Open work rights may apply',
          note: 'Current INZ information says eligible degree-level 7 or higher graduates can work in any legal job, subject to visa conditions and occupational registration where required.',
          sourceUrl: POST_STUDY_URL,
        },
        {
          label: 'Non-degree level 7 or lower',
          value: 'Job restrictions can apply',
          note: 'The qualification must be eligible and the job may need to relate to what you studied.',
          sourceUrl: POST_STUDY_URL,
        },
      ],
      checkedAt: new Date().toISOString(),
      sourceOk: true,
    };
  } catch {
    return {
      title: 'After you finish your study',
      intro: 'Official practical information could not be refreshed safely during this check.',
      facts: [],
      checkedAt: new Date().toISOString(),
      sourceOk: false,
    };
  }
}

export async function getPracticalGuidance(slug: string) {
  if (slug === 'fee-paying-student-visa') {
    return unstable_cache(fetchStudentGuidance, ['student-practical-guidance-v1'], { revalidate: 21600, tags: ['student-practical-guidance'] })();
  }
  if (slug === 'post-study-work-visa') {
    return unstable_cache(fetchPostStudyGuidance, ['post-study-practical-guidance-v1'], { revalidate: 21600, tags: ['post-study-practical-guidance'] })();
  }
  return null;
}
