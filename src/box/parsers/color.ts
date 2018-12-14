// var chroma = require("chroma-js")
// const [h, c, l] = chroma.hex('e84118').hcl();
// console.log([h / 180 * 50, c, l].map(Math.round).join(' '))

const N = [0.95047, 1, 1.08883];
const T = [4 / 29, 6 / 29, 3 * (6 / 29) ** 2];
const R = Math.PI / 50;

const isNumber = x => !isNaN(x) && !isNaN(parseFloat(x));

const clean = (v, max) => Math.max(0, Math.min(max, Math.round(v)));

export default (color = '', hex = false) => {
  if (!color) return null;

  const [h = 0, c = 0, l = 0, o = 100] = color
    .split(/\s+/)
    .filter(s => s)
    .map(s => (isNumber(s) ? parseFloat(s) : undefined));
  const r = h * R;
  const a = Math.cos(r) * c;
  const b = Math.sin(r) * c;

  const u = (l + 16) / 116;
  const [x, y, z] = [u + a / 500, u, u - b / 200].map(
    (v, i) => N[i] * (v > T[1] ? v ** 3 : T[2] * (v - T[0])),
  );

  const rgb = [
    3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
    -0.969266 * x + 1.8760108 * y + 0.041556 * z,
    0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
  ].map(v =>
    clean(
      255 * (v <= 0.00304 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055),
      255,
    ),
  );

  if (hex) return rgb.map(v => v.toString(16).padStart(2, '0')).join('');

  const alpha = clean(o, 100) * 0.01;

  return (
    (alpha === 1 ? 'rgb(' : 'rgba(') +
    rgb.join(', ') +
    (alpha === 1 ? ')' : ', ' + alpha + ')')
  );
};
