'use client';

import { useMemo, useState } from 'react';
import styles from './MinimumWage.module.css';

type Props = {
  adultRate: number;
  startingOutRate: number;
  trainingRate: number;
};

export function MinimumWageCalculator({ adultRate, startingOutRate, trainingRate }: Props) {
  const [hours, setHours] = useState(40);
  const [rateType, setRateType] = useState<'adult' | 'starting' | 'training'>('adult');

  const rate = rateType === 'adult' ? adultRate : rateType === 'starting' ? startingOutRate : trainingRate;
  const pay = useMemo(() => {
    const safeHours = Number.isFinite(hours) ? Math.max(0, hours) : 0;
    const weekly = safeHours * rate;
    return {
      weekly,
      fortnightly: weekly * 2,
      monthly: weekly * 52 / 12,
      annual: weekly * 52,
    };
  }, [hours, rate]);

  const money = (value: number) => new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 2,
  }).format(value);

  return <section className={styles.calculator} aria-labelledby="calculator-title">
    <div className={styles.sectionHeading}>
      <span className={styles.kicker}>Quick calculator</span>
      <h2 id="calculator-title">Minimum wage pay calculator NZ</h2>
      <p>Estimate gross pay before tax. This is a simple wage calculation, not a PAYE or take-home-pay calculator.</p>
    </div>

    <div className={styles.calcGrid}>
      <label>
        <span>Minimum wage type</span>
        <select value={rateType} onChange={(event) => setRateType(event.target.value as typeof rateType)}>
          <option value="adult">Adult minimum wage — ${adultRate.toFixed(2)}/hr</option>
          <option value="starting">Starting-out minimum wage — ${startingOutRate.toFixed(2)}/hr</option>
          <option value="training">Training minimum wage — ${trainingRate.toFixed(2)}/hr</option>
        </select>
      </label>
      <label>
        <span>Hours worked per week</span>
        <input type="number" min="0" max="168" step="0.5" value={hours} onChange={(event) => setHours(Number(event.target.value))}/>
      </label>
    </div>

    <div className={styles.payCards} aria-live="polite">
      <div><span>Weekly</span><strong>{money(pay.weekly)}</strong></div>
      <div><span>Fortnightly</span><strong>{money(pay.fortnightly)}</strong></div>
      <div><span>Average monthly</span><strong>{money(pay.monthly)}</strong></div>
      <div><span>Annual</span><strong>{money(pay.annual)}</strong></div>
    </div>
  </section>;
}
