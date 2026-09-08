'use client';

import { useEffect, useState } from 'react';
import styles from './gold.module.css';

type GoldData = {
  symbol: string;
  currency: string;
  perOz: number;
  perGram24: number;
  perGram22: number;
  perGram18: number;
  perGram14: number;
  spotUsdPerOz: number;
  goldUpdatedAt: string | null;
  fxDate: string | null;
  fetchedAt: string;
  source: string;
};

const currencies = ['NZD','INR','USD','AUD','GBP','EUR','CAD','JPY','SGD','AED'];

function money(value: number, currency: string) {
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}

export default function GoldPriceClient() {
  const [currency, setCurrency] = useState('NZD');
  const [data, setData] = useState<GoldData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    fetch(`/api/world/gold?currency=${encodeURIComponent(currency)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Gold price data is unavailable.');
        return payload as GoldData;
      })
      .then((payload) => { if (active) setData(payload); })
      .catch((err: Error) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [currency]);

  return (
    <section className={styles.tool} aria-label="Gold price today">
      <div className={styles.controls}>
        <label>
          Display currency
          <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
            {currencies.map((code) => <option key={code} value={code}>{code}</option>)}
          </select>
        </label>
      </div>

      {loading ? <div className={styles.state}>Loading latest gold price…</div> : null}
      {error ? <div className={styles.error}>{error}</div> : null}

      {!loading && !error && data ? (
        <>
          <div className={styles.heroPrice}>
            <span>Gold spot price</span>
            <strong>{money(data.perOz, data.currency)}</strong>
            <small>per troy ounce</small>
          </div>

          <div className={styles.priceGrid}>
            <article><span>24K gold</span><strong>{money(data.perGram24, data.currency)}</strong><small>per gram</small></article>
            <article><span>22K gold</span><strong>{money(data.perGram22, data.currency)}</strong><small>per gram</small></article>
            <article><span>18K gold</span><strong>{money(data.perGram18, data.currency)}</strong><small>per gram</small></article>
            <article><span>14K gold</span><strong>{money(data.perGram14, data.currency)}</strong><small>per gram</small></article>
          </div>

          <div className={styles.meta}>
            <p><strong>Gold feed updated:</strong> {data.goldUpdatedAt ? new Date(data.goldUpdatedAt).toLocaleString('en-NZ') : 'Latest available feed'}</p>
            {data.fxDate ? <p><strong>FX reference date:</strong> {data.fxDate}</p> : null}
            <p><strong>Source:</strong> {data.source}</p>
          </div>
        </>
      ) : null}
    </section>
  );
}
