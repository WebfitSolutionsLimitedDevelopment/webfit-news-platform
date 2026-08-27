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

type LanguageCode = (typeof languages)[number][0];

const supportedLanguageCodes = new Set<LanguageCode>(
  languages.map(([code]) => code)
);

const PRODUCTION_ORIGIN = 'https://webfitnews.com';
const TRANSLATED_HOST_SUFFIX = '.translate.goog';

function isSupportedLanguage(value: string | null): value is LanguageCode {
  return Boolean(value && supportedLanguageCodes.has(value as LanguageCode));
}

function stripTranslateParameters(url: URL) {
  url.searchParams.delete('_x_tr_sl');
  url.searchParams.delete('_x_tr_tl');
  url.searchParams.delete('_x_tr_hl');
  url.searchParams.delete('_x_tr_hist');
  return url;
}

function isLocalHostname(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function isTranslatedHostname(hostname: string) {
  return hostname.endsWith(TRANSLATED_HOST_SUFFIX);
}

function getSelectedLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en';

  const params = new URLSearchParams(window.location.search);
  const translatedLanguage = params.get('_x_tr_tl');

  if (isSupportedLanguage(translatedLanguage)) {
    return translatedLanguage;
  }

  return 'en';
}

function getOriginalPageUrl() {
  const current = stripTranslateParameters(new URL(window.location.href));
  const path = `${current.pathname}${current.search}${current.hash}`;

  if (isTranslatedHostname(current.hostname) || isLocalHostname(current.hostname)) {
    return `${PRODUCTION_ORIGIN}${path}`;
  }

  return `${current.origin}${path}`;
}

function buildTranslateUrl(originalUrl: string, language: LanguageCode) {
  const translateUrl = new URL('https://translate.google.com/translate');
  translateUrl.searchParams.set('sl', 'en');
  translateUrl.searchParams.set('tl', language);
  translateUrl.searchParams.set('u', originalUrl);
  return translateUrl.toString();
}

function originalUrlForInternalLink(href: string) {
  const target = new URL(href, window.location.href);

  if (isTranslatedHostname(target.hostname)) {
    stripTranslateParameters(target);
    return `${PRODUCTION_ORIGIN}${target.pathname}${target.search}${target.hash}`;
  }

  if (
    target.hostname === 'webfitnews.com' ||
    target.hostname === 'www.webfitnews.com' ||
    isLocalHostname(target.hostname)
  ) {
    stripTranslateParameters(target);
    return `${PRODUCTION_ORIGIN}${target.pathname}${target.search}${target.hash}`;
  }

  return null;
}

export function LanguageSelector({ mobile = false }: { mobile?: boolean }) {
  const [language, setLanguage] = useState<LanguageCode>('en');

  useEffect(() => {
    const selectedLanguage = getSelectedLanguage();
    setLanguage(selectedLanguage);

    if (selectedLanguage === 'en' || !isTranslatedHostname(window.location.hostname)) {
      return;
    }

    function handleInternalNavigation(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;

      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const rawHref = anchor.getAttribute('href');
      if (
        !rawHref ||
        rawHref.startsWith('#') ||
        rawHref.startsWith('mailto:') ||
        rawHref.startsWith('tel:') ||
        rawHref.startsWith('javascript:')
      ) {
        return;
      }

      const originalDestination = originalUrlForInternalLink(anchor.href);
      if (!originalDestination) return;

      event.preventDefault();
      window.location.assign(buildTranslateUrl(originalDestination, selectedLanguage));
    }

    document.addEventListener('click', handleInternalNavigation, true);

    return () => {
      document.removeEventListener('click', handleInternalNavigation, true);
    };
  }, []);

  function changeLanguage(nextLanguageValue: string) {
    if (!isSupportedLanguage(nextLanguageValue)) return;

    setLanguage(nextLanguageValue);
    const originalUrl = getOriginalPageUrl();

    if (nextLanguageValue === 'en') {
      window.location.assign(originalUrl);
      return;
    }

    window.location.assign(buildTranslateUrl(originalUrl, nextLanguageValue));
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
