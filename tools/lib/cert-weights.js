/* Microsoft publishes each exam skill area's weight as a range ("25–30%"). Scoring uses the midpoint of the
   range (wm) normalised so the areas of one outline version sum to 1 (wn). tests/curriculum checks every
   range parses and every version sums to 1. */
'use strict';
const parse = w => {
  const m = String(w).match(/^\s*(\d+(?:\.\d+)?)\s*(?:[–-]\s*(\d+(?:\.\d+)?))?\s*%\s*$/);
  if (!m) return null;
  const a = +m[1], b = m[2] ? +m[2] : a;
  return b >= a ? (a + b) / 2 : null;
};
const weigh = cert => Object.assign({}, cert, {
  versions: cert.versions.map(v => {
    const mids = v.areas.map(a => parse(a.w));
    const sum = mids.reduce((x, y) => x + (y || 0), 0);
    return Object.assign({}, v, { areas: v.areas.map((a, i) => Object.assign({}, a, { wm: mids[i], wn: mids[i] && sum ? Math.round(10000 * mids[i] / sum) / 10000 : null })) });
  })
});
module.exports = { parse, weigh };
