import Link from 'next/link';
import { getPublicSiteSettings } from '@/lib/public-settings';
import styles from './AdvertisingJourneyPromo.module.css';

function FacebookIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.7 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5H17V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V10H8v3h2.6v8h3.1z"/></svg>}
function InstagramIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.5" cy="6.7" r="1"/></svg>}
function YouTubeIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8.2a3 3 0 0 0-2.1-2.1C17.1 5.6 12 5.6 12 5.6s-5.1 0-6.9.5A3 3 0 0 0 3 8.2 31 31 0 0 0 2.6 12 31 31 0 0 0 3 15.8a3 3 0 0 0 2.1 2.1c1.8.5 6.9.5 6.9.5s5.1 0 6.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-3.8 31 31 0 0 0-.4-3.8z"/><path className={styles.play} d="m10 15.4 5-3.4-5-3.4v6.8z"/></svg>}
function PhoneIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 3.5 4.6 5.2c-.8.5-1.1 1.5-.8 2.4 1.9 6.1 6.5 10.7 12.6 12.6.9.3 1.9 0 2.4-.8l1.7-2.6c.4-.7.3-1.6-.3-2.2l-2.7-2.1c-.6-.5-1.4-.5-2 0l-1.7 1.4a14.8 14.8 0 0 1-3.7-3.7l1.4-1.7c.5-.6.5-1.4 0-2L9.4 3.8c-.6-.6-1.5-.7-2.2-.3z"/></svg>}
function MailIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>}

const iconMap:Record<string,()=>React.JSX.Element>={facebook:FacebookIcon,instagram:InstagramIcon,youtube:YouTubeIcon};

export async function AdvertisingJourneyPromo(){
  const settings=await getPublicSiteSettings();
  const social=['facebook','instagram','youtube']
    .map(name=>({name,url:settings.social?.[name]}))
    .filter(item=>Boolean(item.url));

  return <section className={styles.wrap} aria-labelledby="advertising-journey-title">
    <div className={styles.findUs}>
      <div>
        <h2>Find us here</h2>
        <div className={styles.socialIcons}>
          {social.map(({name,url})=>{const Icon=iconMap[name];return <a key={name} className={styles.socialIcon} href={url} target="_blank" rel="noopener noreferrer" aria-label={name} title={name}>{Icon?<Icon/>:null}</a>})}
        </div>
      </div>
      <div className={styles.contactLines}>
        <a href="tel:0221299323"><span className={styles.contactIcon}><PhoneIcon/></span><span>022 129 9323</span></a>
        <a href="mailto:Sandy@WebfitNews.co.nz"><span className={styles.contactIcon}><MailIcon/></span><span>Sandy@WebfitNews.co.nz</span></a>
      </div>
    </div>

    <div className={styles.journeyCard}>
      <div className={styles.deviceArtwork} aria-hidden="true">
        <svg viewBox="0 0 260 150" role="presentation">
          <rect className={styles.deviceStroke} x="18" y="20" width="150" height="92" rx="7"/>
          <rect className={styles.deviceScreen} x="29" y="32" width="128" height="68" rx="3"/>
          <rect className={styles.deviceAccent} x="39" y="42" width="52" height="10" rx="2"/>
          <rect className={styles.deviceSoft} x="39" y="60" width="34" height="28" rx="2"/>
          <rect className={styles.deviceSoft} x="79" y="60" width="68" height="8" rx="2"/>
          <rect className={styles.deviceSoft} x="79" y="75" width="54" height="8" rx="2"/>
          <path className={styles.deviceStrokeLine} d="M7 117h172l-9 11H16z"/>
          <rect className={styles.deviceStroke} x="165" y="42" width="70" height="95" rx="9"/>
          <rect className={styles.deviceScreen} x="174" y="52" width="52" height="74" rx="3"/>
          <rect className={styles.deviceAccent} x="183" y="61" width="34" height="8" rx="2"/>
          <rect className={styles.deviceSoft} x="183" y="77" width="34" height="17" rx="2"/>
          <rect className={styles.deviceStroke} x="132" y="69" width="44" height="74" rx="10"/>
          <rect className={styles.deviceScreen} x="139" y="79" width="30" height="53" rx="3"/>
          <rect className={styles.deviceAccent} x="144" y="85" width="20" height="6" rx="2"/>
          <rect className={styles.deviceSoft} x="144" y="97" width="20" height="14" rx="2"/>
        </svg>
      </div>

      <div className={styles.journeyCopy}>
        <h2 id="advertising-journey-title">Start your advertising journey</h2>
        <p>All information about our advertising solutions is available here.</p>
        <Link className={styles.cta} href="/advertise-media-kit">Specifications, rates & deadlines</Link>
      </div>
    </div>
  </section>;
}
