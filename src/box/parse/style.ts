import { parseValue } from '../../utils';

import { isNumber, split, toNumber } from '../utils';

import parseColor from './color';

export default (values, context, isInput = false) => {
  const result = {} as any;
  const numbers = [] as number[];
  const parts = split(parseValue(values.style, 'string')).filter(p => {
    if (isNumber(p)) {
      const n = toNumber(p);
      numbers.push(n);
    } else if (p === 'normal') {
      result.fontWeight = 'normal';
      result.fontStyle = 'normal';
    } else if (p === 'bold') {
      result.fontWeight = 'bold';
    } else if (p === 'italic') {
      result.fontStyle = 'italic';
    } else if (p === 'strike') {
      result.textDecoration = 'line-through';
    } else if (p === 'exact') {
      result.whiteSpace = 'pre';
    } else if (p === 'bullet') {
      result.display = 'list-item';
      result.listStylePosition = 'inside';
    } else if (p === 'password') {
      result.password = true;
    } else if (['center', 'left', 'right'].includes(p)) {
      result.textAlign = p;
    } else if (p === 'flow') {
      result.flow = true;
    } else {
      return true;
    }
  });
  if (numbers.length > 0) {
    const [fontSize, lineHeight] = numbers
      .sort((a, b) => a - b)
      .map(x => Math.round(x));
    result.fontSize = fontSize;
    if (lineHeight) result.lineHeight = lineHeight / fontSize;
  }
  if (parts.length > 0) result.fontFamily = parts.join(' ');
  const { flow, fontSize, lineHeight, password, ...styleValues } = result;
  const ctx = {
    ...context,
    flow: context.flow || flow || false,
    size: fontSize || context.size || 20,
    height: isInput ? 1.5 : lineHeight || context.height || 1.5,
    color: parseColor(parseValue(values.color, 'string')) || context.color,
  };
  return {
    context: ctx,
    pad: Math.floor(ctx.size * (ctx.height - 1)) * -0.5,
    props: {
      ...(password ? { type: 'password' } : {}),
      style: {
        fontSize: `${ctx.size}px`,
        minHeight: `${ctx.size}px`,
        lineHeight: `${Math.floor(ctx.height * ctx.size)}px`,
        ...styleValues,
        color: ctx.color,
      },
    },
  };
};
