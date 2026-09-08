'use client';

import { useMemo, useState } from 'react';
import styles from './travel.module.css';

type Destination = {
  country: string;
  region: string;
  authority: string;
  entryUrl: string;
  note: string;
  tags: string[];
};

const destinations: Destination[] = [
  { country: 'Australia', region: 'Oceania', authority: 'Australian Department of Home Affairs', entryUrl: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder', note: 'Check visa or travel-authority eligibility, transit rules and permitted activities before departure.', tags: ['visa', 'eta', 'transit'] },
  { country: 'Canada', region: 'North America', authority: 'Immigration, Refugees and Citizenship Canada', entryUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html', note: 'Check whether you need a visitor visa or electronic travel authorization and review border requirements.', tags: ['visa', 'eta', 'border'] },
  { country: 'China', region: 'Asia', authority: 'National Immigration Administration / Chinese diplomatic missions', entryUrl: 'https://en.nia.gov.cn/', note: 'Confirm visa, visa-free transit and entry conditions with the official immigration authority or relevant Chinese mission.', tags: ['visa', 'transit', 'border'] },
  { country: 'European Union / Schengen Area', region: 'Europe', authority: 'European Union', entryUrl: 'https://europa.eu/youreurope/citizens/travel/entry-exit/index_en.htm', note: 'Check Schengen entry rules, passport requirements and any applicable EU border systems for your nationality.', tags: ['schengen', 'border', 'passport'] },
  { country: 'Fiji', region: 'Pacific', authority: 'Fiji Immigration Department', entryUrl: 'https://www.immigration.gov.fj/', note: 'Check visitor-permit eligibility, passport validity and onward-travel requirements before flying.', tags: ['visa', 'passport', 'pacific'] },
  { country: 'India', region: 'Asia', authority: 'Government of India — Indian Visa Online', entryUrl: 'https://indianvisaonline.gov.in/', note: 'Use the official Indian Visa Online service to check visa categories, e-Visa eligibility and application requirements.', tags: ['visa', 'evisa', 'asia'] },
  { country: 'Indonesia', region: 'Asia', authority: 'Directorate General of Immigration, Indonesia', entryUrl: 'https://evisa.imigrasi.go.id/', note: 'Check official e-Visa / visa-on-arrival eligibility and current arrival conditions for your passport.', tags: ['visa', 'evisa', 'arrival'] },
  { country: 'Japan', region: 'Asia', authority: 'Ministry of Foreign Affairs of Japan', entryUrl: 'https://www.mofa.go.jp/j_info/visit/visa/index.html', note: 'Check Japan’s visa exemptions, visa application rules and passport-specific requirements on the official MOFA site.', tags: ['visa', 'passport', 'asia'] },
  { country: 'New Zealand', region: 'Oceania', authority: 'Immigration New Zealand', entryUrl: 'https://www.immigration.govt.nz/new-zealand-visas/', note: 'Check visa or NZeTA requirements, transit rules and entry conditions directly with Immigration New Zealand.', tags: ['visa', 'nzeta', 'transit'] },
  { country: 'Singapore', region: 'Asia', authority: 'Immigration & Checkpoints Authority Singapore', entryUrl: 'https://www.ica.gov.sg/enter-transit-depart/entering-singapore', note: 'Check visa requirements, passport validity and the official arrival-card process before travelling.', tags: ['visa', 'arrival', 'passport'] },
  { country: 'South Korea', region: 'Asia', authority: 'Korea Immigration Service / K-ETA', entryUrl: 'https://www.k-eta.go.kr/', note: 'Check whether your passport needs a visa or K-ETA and confirm any temporary exemptions before travel.', tags: ['visa', 'keta', 'asia'] },
  { country: 'United Arab Emirates', region: 'Middle East', authority: 'UAE Government', entryUrl: 'https://u.ae/en/information-and-services/visa-and-emirates-id/visit-visas', note: 'Check visit-visa eligibility, visa-on-arrival conditions and passport rules on the official UAE government portal.', tags: ['visa', 'arrival', 'middle east'] },
  { country: 'United Kingdom', region: 'Europe', authority: 'UK Government', entryUrl: 'https://www.gov.uk/check-uk-visa', note: 'Use the official checker for visa or electronic travel authorisation requirements based on nationality and travel purpose.', tags: ['visa', 'eta', 'europe'] },
  { country: 'United States', region: 'North America', authority: 'U.S. Department of State / U.S. Customs and Border Protection', entryUrl: 'https://travel.state.gov/content/travel/en/us-visas/tourism-visit.html', note: 'Check visitor-visa or Visa Waiver Program eligibility and any ESTA requirement before departure.', tags: ['visa', 'esta', 'border'] },
];

export default function TravelRequirementsExplorer() {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('All');

  const regions = useMemo(() => ['All', ...Array.from(new Set(destinations.map((item) => item.region))).sort()], []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return destinations.filter((item) => {
      const matchesRegion = region === 'All' || item.region === region;
      const haystack = `${item.country} ${item.region} ${item.authority} ${item.tags.join(' ')}`.toLowerCase();
      return matchesRegion && (!q || haystack.includes(q));
    });
  }, [query, region]);

  return (
    <section className={styles.explorer} aria-labelledby="destination-checker-heading">
      <div className={styles.sectionHead}>
        <p className={styles.eyebrow}>Destination checker</p>
        <h2 id="destination-checker-heading">Find the official entry-requirement source</h2>
        <p>Search a destination below. We link to the government authority that sets or administers the entry rules rather than guessing from a generic database.</p>
      </div>

      <div className={styles.controls}>
        <label>
          <span>Search destination or requirement</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. Australia, ESTA, Schengen" />
        </label>
        <label>
          <span>Region</span>
          <select value={region} onChange={(event) => setRegion(event.target.value)}>
            {regions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>

      <div className={styles.grid}>
        {filtered.map((item) => (
          <article className={styles.card} key={item.country}>
            <div className={styles.cardTop}>
              <span>{item.region}</span>
              <h3>{item.country}</h3>
            </div>
            <p>{item.note}</p>
            <div className={styles.authority}>Official authority: <strong>{item.authority}</strong></div>
            <a href={item.entryUrl} target="_blank" rel="noreferrer noopener">Check official entry requirements ↗</a>
          </article>
        ))}
      </div>

      {filtered.length === 0 ? <p className={styles.empty}>No curated destination matched. Use the official global travel-advice links below, or check the destination country’s immigration authority or embassy.</p> : null}
    </section>
  );
}
