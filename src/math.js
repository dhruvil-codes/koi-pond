export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))
export const wrap = a => Math.atan2(Math.sin(a), Math.cos(a))
export const hash = (x, y) => ((Math.imul(x + 31, 374761393) ^ Math.imul(y + 19, 668265263)) >>> 0) / 4294967296
export const ramp = (a, b, count) => Array.from({ length: count }, (_, i) => '#' + [0, 1, 2].map(c => {
  const p = parseInt(a.slice(c * 2, c * 2 + 2), 16), q = parseInt(b.slice(c * 2, c * 2 + 2), 16)
  return Math.round(p + (q - p) * i / (count - 1)).toString(16).padStart(2, '0')
}).join(''))
