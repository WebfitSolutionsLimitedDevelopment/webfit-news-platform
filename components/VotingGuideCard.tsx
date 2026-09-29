import styles from './VotingGuideCard.module.css';

/** Public-information signpost. No personal information is collected. */
export function VotingGuideCard(){
  return <aside className={styles.card} aria-label="Auckland 2028 local election voting guide">
    <span className={styles.eyebrow}>WEBFIT NEWS COMMUNITY GUIDE</span>
    <h2>Auckland voting in 2028: what to do now</h2>
    <p>Auckland Council has voted to move to in-person booth voting. Booth locations, hours and assistance arrangements are still to be confirmed.</p>
    <div className={styles.action}>
      <strong>Start here: check your enrolment</strong>
      <span>Make sure your residential address is correct. You can check or update it with the Electoral Commission.</span>
      <a href="https://vote.nz/" target="_blank" rel="noopener noreferrer">Check your enrolment at Vote NZ ↗</a>
    </div>
    <p className={styles.small}><strong>Need assistance or travelling in 2028?</strong> Check the confirmed special-voting and accessibility arrangements before the election. Do not assume general-election rules apply.</p>
    <p className={styles.small}>For confirmed booth locations and opening hours, check <a href="https://www.aucklandcouncil.govt.nz/" target="_blank" rel="noopener noreferrer">Auckland Council ↗</a> closer to the election.</p>
    <p className={styles.note}>Information guide, not official electoral instructions. Details may change.</p>
  </aside>;
}
