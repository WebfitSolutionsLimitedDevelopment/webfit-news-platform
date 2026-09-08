import type { VisaCategory } from './immigration';

export type ImmigrationCategoryPageConfig = {
  category: VisaCategory;
  slug: string;
  label: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  overviewTitle: string;
  overview: string[];
  faq: Array<{ question: string; answer: string }>;
  relatedSlugs: string[];
};

export const immigrationCategoryPages: ImmigrationCategoryPageConfig[] = [
  {
    category: 'Work',
    slug: 'work-visas',
    label: 'Work visas',
    title: 'New Zealand Work Visas: NZ Work Visa Guide',
    metaTitle: 'NZ Work Visas 2026 | New Zealand Work Visa Guide | Webfit News',
    metaDescription: 'Compare current New Zealand work visas, including AEWV, post-study, seasonal, partner and specialist work pathways. Read NZ work visa information, official INZ sources and downloadable checklists.',
    intro: 'Explore New Zealand work visa pathways for employment, post-study work, seasonal jobs, religious work, specialist purposes and other approved work situations. Each guide links to Immigration New Zealand and includes a downloadable checklist based on the latest source snapshot used by Webfit News.',
    overviewTitle: 'How New Zealand work visas generally differ',
    overview: [
      'Some work visas are tied to a New Zealand job offer, employer, occupation or specific purpose, while others depend on study history, partnership or seasonal eligibility.',
      'Work rights, employer restrictions, permitted length of stay and family options differ between visa types, so the conditions on the specific visa matter.',
      'Webfit News provides general public information only. Use the official Immigration New Zealand page for the final eligibility rules and application process.',
    ],
    faq: [
      { question: 'What New Zealand work visas are covered here?', answer: 'This page groups the current work visa pathways covered by the Webfit News NZ Visa Guide, including employer-linked, post-study, seasonal and specialist work visas. Open an individual visa guide for its current official source and checklist.' },
      { question: 'Which NZ work visa should I apply for?', answer: 'Webfit News does not recommend a visa or assess personal eligibility. The correct pathway depends on your circumstances. Compare the general visa purposes here, then confirm the official Immigration New Zealand requirements or use a licensed or exempt immigration adviser for personal advice.' },
      { question: 'How often is the work visa information checked?', answer: 'The individual visa guides are configured to re-check their Immigration New Zealand source at least every six hours. If a source cannot be read reliably, the guide displays a warning instead of inventing a value.' },
      { question: 'Can I download an NZ work visa checklist?', answer: 'Yes. Every visa listed on this page has a Webfit News branded PDF checklist generated from the same latest source snapshot used by the guide.' },
    ],
    relatedSlugs: ['student-visas', 'residence-visas', 'family-visas'],
  },
  {
    category: 'Study',
    slug: 'student-visas',
    label: 'Student visas',
    title: 'New Zealand Student Visas: NZ Student Visa Guide',
    metaTitle: 'NZ Student Visas 2026 | New Zealand Student Visa Guide | Webfit News',
    metaDescription: 'Compare current New Zealand student visas for fee-paying study, pathways, scholarships and exchanges. Read NZ student visa information, official INZ sources, work-rights guidance and checklists.',
    intro: 'Explore New Zealand student visa pathways for fee-paying study, approved study pathways, government-supported study, scholarships and exchange programmes. The detailed guides organise current public Immigration New Zealand information and provide direct official-source links.',
    overviewTitle: 'What to compare across New Zealand student visas',
    overview: [
      'Student visa requirements can depend on the course, education provider, funding arrangement, scholarship or exchange programme involved.',
      'Study length, financial evidence, insurance and work rights can vary, and any work rights are controlled by the conditions on the particular visa.',
      'For post-study options, use the separate Post Study Work Visa guide and always confirm the current Immigration New Zealand rules before making plans.',
    ],
    faq: [
      { question: 'What NZ student visas are listed here?', answer: 'The Webfit News guide currently groups fee-paying, pathway, government-supported, scholarship and exchange student visa pathways on this page. Each visa has its own detailed page and official Immigration New Zealand source.' },
      { question: 'Can international students work in New Zealand?', answer: 'Some student visas can include work rights, but the exact hours and conditions depend on the visa and course. The individual guide shows practical information where Webfit News can safely source it, and the visa conditions and Immigration New Zealand remain authoritative.' },
      { question: 'Is there a checklist for a New Zealand student visa?', answer: 'Yes. Every listed student visa has a downloadable Webfit News branded PDF checklist generated from the latest source snapshot used by that visa guide.' },
      { question: 'Does Webfit News assess whether I qualify for a student visa?', answer: 'No. These pages provide general public information only and do not assess personal eligibility or recommend what to put in an application.' },
    ],
    relatedSlugs: ['work-visas', 'visitor-visas', 'family-visas'],
  },
  {
    category: 'Visit',
    slug: 'visitor-visas',
    label: 'Visitor visas',
    title: 'New Zealand Visitor Visas: NZ Visitor Visa Guide',
    metaTitle: 'NZ Visitor Visas 2026 | New Zealand Visitor Visa Guide | Webfit News',
    metaDescription: 'Compare current New Zealand visitor visas for holidays, family visits, parents, medical treatment, groups and transit. Read NZ visitor visa information, official INZ sources and checklists.',
    intro: 'Explore New Zealand visitor visa pathways for holidays, visiting family, longer parent visits, guardians, medical treatment, group travel and transit. Each Webfit News guide links directly to the relevant Immigration New Zealand source and provides a current downloadable checklist.',
    overviewTitle: 'What to check before choosing a New Zealand visitor visa page',
    overview: [
      'Visitor pathways are designed for different temporary purposes, including general visits, family visits, parent stays, guardianship, treatment, transit and organised groups.',
      'Permitted stay, sponsorship, funds, health requirements and whether family members can be included can differ between visitor visa types.',
      'Visitor visas generally do not provide ordinary work rights. Always read the conditions of the specific official visa page before travelling or applying.',
    ],
    faq: [
      { question: 'What New Zealand visitor visas are covered?', answer: 'This page groups the visitor visa pathways currently covered by Webfit News, including the general Visitor Visa and specialist parent, guardian, medical, group and transit pathways.' },
      { question: 'How long can I stay in New Zealand on a visitor visa?', answer: 'There is no single stay period for every visitor pathway. Open the relevant visa guide to see the latest stay information Webfit News could safely extract, then verify it on Immigration New Zealand.' },
      { question: 'Can I work on a New Zealand visitor visa?', answer: 'Ordinary visitor visas are not general work visas. Conditions vary, so check the specific Immigration New Zealand visa page for what is and is not permitted.' },
      { question: 'Can I download a visitor visa checklist?', answer: 'Yes. Every visitor visa listed here has a branded PDF checklist tied to the latest source snapshot used by its Webfit News guide.' },
    ],
    relatedSlugs: ['family-visas', 'student-visas', 'work-visas'],
  },
  {
    category: 'Residence',
    slug: 'residence-visas',
    label: 'Residence visas',
    title: 'New Zealand Residence Visas: NZ Residence Pathways Guide',
    metaTitle: 'NZ Residence Visas 2026 | New Zealand Residence Pathways | Webfit News',
    metaDescription: 'Compare current New Zealand residence visa pathways for skilled workers, Green List roles, investors, business, family and humanitarian categories, with official INZ sources and checklists.',
    intro: 'Explore New Zealand residence pathways for skilled employment, Green List roles, care and transport work, investment, business, family and qualifying humanitarian categories. Each detailed guide points back to the current Immigration New Zealand source.',
    overviewTitle: 'How New Zealand residence pathways differ',
    overview: [
      'Residence pathways can be based on skilled employment, qualifying work history, occupation lists, investment, business activity, family relationships or specific humanitarian circumstances.',
      'Some pathways require an earlier period of qualifying work or another visa before residence, while others can provide a direct residence route when the published criteria are met.',
      'Residence rules are high-impact and can change. Use Webfit News as a reference layer, then confirm the current official Immigration New Zealand requirements before acting.',
    ],
    faq: [
      { question: 'What New Zealand residence visas are listed here?', answer: 'This page groups the residence pathways currently covered by the Webfit News guide, including skilled, Green List, workforce, investor, business, family and humanitarian categories.' },
      { question: 'Is a Resident Visa the same as a Permanent Resident Visa?', answer: 'They are not the same immigration status. This category page focuses on the residence pathways covered by Webfit News. For any progression or travel-condition question, check the current Immigration New Zealand rules for your exact status.' },
      { question: 'Can Webfit News tell me whether I qualify for New Zealand residence?', answer: 'No. Webfit News does not assess personal circumstances, points, eligibility or likely outcomes. The pages organise public information and link to the official source.' },
      { question: 'Are residence visa checklists downloadable?', answer: 'Yes. Every residence visa guide listed here provides a branded PDF checklist generated from the same latest source snapshot used by the page.' },
    ],
    relatedSlugs: ['work-visas', 'family-visas', 'student-visas'],
  },
  {
    category: 'Family',
    slug: 'family-visas',
    label: 'Family visas',
    title: 'New Zealand Family Visas: Partner, Parent and Child Visa Guide',
    metaTitle: 'NZ Family Visas 2026 | Partner, Parent & Child Visas | Webfit News',
    metaDescription: 'Compare New Zealand family visas for partners, parents and dependent children, including work, visitor and residence pathways. Read official INZ-linked information and download checklists.',
    intro: 'Explore New Zealand family visa pathways for partners, parents and dependent children. This category includes temporary work and visitor options as well as family-linked residence pathways, with each guide linked back to Immigration New Zealand.',
    overviewTitle: 'What matters across New Zealand family visa pathways',
    overview: [
      'Family visa pathways can depend on the relationship involved, the supporting person’s New Zealand immigration or citizenship status, sponsorship rules and dependency criteria.',
      'A partner or child may have different work, study or visitor options depending on the supporting person’s visa and the exact family pathway.',
      'Relationship and sponsorship evidence can be highly fact-specific. Webfit News does not evaluate that evidence or advise whether it is sufficient for an application.',
    ],
    faq: [
      { question: 'What NZ family visas are covered here?', answer: 'This page groups the partner, parent and dependent-child pathways currently covered by Webfit News, including work, visitor, student and residence visa categories linked to family relationships.' },
      { question: 'What evidence is needed for a New Zealand partner visa?', answer: 'Evidence requirements depend on the specific partner pathway and circumstances. Open the relevant visa guide for the public requirements Webfit News could safely organise, then use the official Immigration New Zealand page for the complete current evidence rules.' },
      { question: 'Can parents visit or live in New Zealand through family visas?', answer: 'Immigration New Zealand has different parent visitor and residence pathways with different sponsorship, stay and eligibility settings. This page links the parent pathways currently covered by Webfit News.' },
      { question: 'Can I download a family visa checklist?', answer: 'Yes. Every family visa guide listed here includes a branded PDF checklist based on the latest official-source snapshot used by that guide.' },
    ],
    relatedSlugs: ['visitor-visas', 'work-visas', 'residence-visas'],
  },
];

export function getImmigrationCategoryPage(slug: string) {
  return immigrationCategoryPages.find((page) => page.slug === slug);
}
