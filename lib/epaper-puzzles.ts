/*
 * The e-paper's weekly word search, made from the words in that week's news.
 * Same puzzle every time for a given edition (seeded from its date), so it can be
 * printed, played on screen and saved between visits.
 */

export type WordSearch = { size: number; grid: string; words: string[]; placements: Array<{ word: string; cells: number[] }> };

const SIZE = 12;
const WANT = 10;
// Common words that make dull puzzle words.
const STOP = new Set(('ABOUT ABOVE AFTER AGAIN AGAINST ALREADY ALSO AMONG ANOTHER BECAUSE BEEN BEFORE BEING BELOW BETWEEN BOTH COULD DOES DOING DURING EACH EVERY FIRST FROM FURTHER HAVE HAVING HERE INTO ITSELF JUST LAST LIKE MADE MAKE MANY MIGHT MORE MOST MUCH MUST NEVER NEXT ONLY OTHER OVER PEOPLE SAID SAYS SHOULD SINCE SOME STILL SUCH THAN THAT THEIR THEM THEN THERE THESE THEY THIS THOSE THROUGH UNDER UNTIL VERY WANT WERE WHAT WHEN WHERE WHICH WHILE WILL WITH WITHIN WITHOUT WOULD YEAR YEARS YOUR WEEK WEEKS TOLD TIME TIMES THINGS GOING TAKE TAKEN WHETHER ACCORDING ANNOUNCED INCLUDING HOWEVER ALTHOUGH ACROSS AROUND WHOSE GIVEN STATEMENT REPORTED REPORT').split(' '));
const FALLBACK = ['AUCKLAND', 'WELLINGTON', 'DIWALI', 'MATARIKI', 'KIWI', 'HARBOUR', 'TAONGA', 'CRICKET', 'MONSOON', 'FESTIVAL', 'ELECTION', 'COMMUNITY'];
const DIRS = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];

function seeded(key: string): () => number {
  let h = 2166136261;
  for (const c of `webfit-wordsearch-${key}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** The week's words: the most-used real words (5 to 10 letters) in the edition's headlines and stories. Headlines count double. */
export function pickWords(headlines: string[], texts: string[]): string[] {
  const score = new Map<string, number>();
  const add = (t: string, w: number) => {
    for (const raw of t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().match(/[A-Z]+/g) || []) {
      if (raw.length < 5 || raw.length > 10 || STOP.has(raw) || /S$/.test(raw) && score.has(raw.slice(0, -1))) continue;
      score.set(raw, (score.get(raw) || 0) + w);
    }
  };
  headlines.forEach(t => add(t, 3));
  texts.forEach(t => add(t, 1));
  const ranked = [...score.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([w]) => w);
  const out: string[] = [];
  for (const w of [...ranked, ...FALLBACK]) {
    if (out.length >= WANT) break;
    if (out.some(o => o.includes(w) || w.includes(o))) continue; // no word hidden inside another
    out.push(w);
  }
  return out;
}

export function buildWordSearch(key: string, words: string[]): WordSearch {
  const rnd = seeded(key);
  const grid: string[] = Array(SIZE * SIZE).fill('');
  const placements: WordSearch['placements'] = [];
  for (const word of [...words].sort((a, b) => b.length - a.length)) {
    let placed = false;
    for (let tries = 0; tries < 300 && !placed; tries += 1) {
      const [dr, dc] = DIRS[Math.floor(rnd() * (tries < 150 ? 4 : 8))]; // mostly forwards; backwards only if needed
      const r0 = Math.floor(rnd() * SIZE), c0 = Math.floor(rnd() * SIZE);
      const cells: number[] = [];
      for (let i = 0; i < word.length; i += 1) {
        const r = r0 + dr * i, c = c0 + dc * i;
        if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) break;
        const idx = r * SIZE + c;
        if (grid[idx] && grid[idx] !== word[i]) break;
        cells.push(idx);
      }
      if (cells.length !== word.length) continue;
      cells.forEach((idx, i) => { grid[idx] = word[i]; });
      placements.push({ word, cells });
      placed = true;
    }
  }
  const letters = 'ABCDEFGHIJKLMNOPRSTUWAEIOENRST'; // weighted towards common letters, like a printed puzzle
  for (let i = 0; i < grid.length; i += 1) if (!grid[i]) grid[i] = letters[Math.floor(rnd() * letters.length)];
  const placedWords = placements.map(p => p.word);
  return { size: SIZE, grid: grid.join(''), words: words.filter(w => placedWords.includes(w)), placements };
}
