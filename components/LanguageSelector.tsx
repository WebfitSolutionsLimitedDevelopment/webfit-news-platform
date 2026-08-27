'use client';

import { useEffect, useState } from 'react';
import styles from './LanguageSelector.module.css';

const languages = [
  ['en', 'English'],
  ['hi', 'Hindi'],
  ['gu', 'Gujarati'],
  ['pa', 'Punjabi'],
  ['ml', 'Malayalam'],
  ['ta', 'Tamil'],
  ['te', 'Telugu'],
  ['mr', 'Marathi'],
  ['kn', 'Kannada'],
  ['de', 'German'],
  ['fr', 'French'],
  ['es', 'Spanish'],
] as const;

const supportedLanguageCodes = new Set(languages.map(([code]) => code));

function getSelectedLanguage() {
  if (typeof window === 'undefined') return 'en';

  const params = new URLSearchParams(window.location.search);
  const translatedLanguage = params.get('_x_tr_tl');

  if (translatedLanguage && supportedLanguageCodes.has(translatedLanguage as (typeof languages)[number][0])) {
    return translatedLanguage;
  }

  return 'en';
}

function getOriginalPageUrl() {
  const url = new URL(window.location.href);

  url.searchParams.delete('_x_tr_sl');
  url.searchParams.delete('_x_tr_tl');
  url.searchParams.delete('_x_tr_hl');

  const path = `${url.pathname}${url.search}${url.hash}`;
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  // Google Translate must be able to fetch the source page from the internet.
  // Local development therefore falls back to the live site, while production
  // and Vercel preview deployments translate their own current public origin.
  const sourceOrigin = isLocalhost ? 'https://webfitnews.com' : url.origin;

  return `${sourceOrigin}${path}`;
}

export function LanguageSelector({ mobile = false }: { mobile?: boolean }) {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    setLanguage(getSelectedLanguage());
  }, []);

  function changeLanguage(nextLanguage: string) {
    setLanguage(nextLanguage);

    const originalUrl = getOriginalPageUrl();

    if (nextLanguage === 'en') {
      window.location.assign(originalUrl);
      return;
    }

    const translateUrl = new URL('https://translate.google.com/translate');
    translateUrl.searchParams.set('sl', 'en');
    translateUrl.searchParams.set('tl', nextLanguage);
    translateUrl.searchParams.set('u', originalUrl);

    window.location.assign(translateUrl.toString());
  }

  return (
    <label className={`${styles.wrapper} ${mobile ? styles.mobile : ''}`}>
      <span className={styles.label}>Language</span>
      <select
        className={styles.select}
        aria-label="Translate Webfit News"
        value={language}
        onChange={(event) => changeLanguage(event.target.value)}
      >
        {languages.map(([code, name]) => (
          <option key={code} value={code}>{name}</option>
        ))}
      </select>
    </label>
  );
}
