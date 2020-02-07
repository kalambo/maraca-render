import parseColor from './color';
import { isNumber, parseValue, split, toNumber } from './utils';

export default (values, context) => {
  const result = {} as any;
  const numbers = [] as number[];
  const parts = split(parseValue(values.style, 'string')).filter(p => {
    if (isNumber(p)) {
      const n = toNumber(p);
      numbers.push(n);
    } else if (p === 'normal') {
      result.weight = 'normal';
      result.style = 'normal';
    } else if (p === 'bold') {
      result.weight = 'bold';
    } else if (p === 'italic') {
      result.style = 'italic';
    } else if (['center', 'left', 'right'].includes(p)) {
      result.align = p;
    } else if (['strike', 'exact', 'bullet', 'hidden', 'flow'].includes(p)) {
      result[p] = true;
    } else {
      return true;
    }
  });
  if (numbers.length > 0) {
    const [size, height] = numbers
      .sort((a, b) => a - b)
      .map(x => Math.round(x));
    result.size = size;
    if (height) result.height = height / size;
  }
  if (values.input) result.height = 1.5;
  if (parts.length > 0) result.font = parts.join(' ');
  const color = parseColor(parseValue(values.color, 'string'));
  if (color) result.color = color;
  const ctx = {
    size: 20,
    height: 1.5,
    color: 'black',
    font: 'Arial',
    ...context,
    ...result,
  };
  ctx.pad = Math.floor(ctx.size * (ctx.height - 1)) * -0.5;
  return ctx;
};
