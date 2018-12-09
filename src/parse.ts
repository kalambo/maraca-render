import getColor from './color';
import { isNumber, split, toNumber } from './utils';

const parseDirs = dirs => {
  const parts = split(dirs);
  if (parts.length === 0) return null;
  return [
    parts[0] || 0,
    parts[3] || parts[1] || parts[0] || 0,
    parts[2] || parts[0] || 0,
    parts[1] || parts[0] || 0,
  ].map(toNumber);
};

const parseStyle = text => {
  const result = {} as any;
  const parts = split(text).filter(p => {
    if (isNumber(p)) {
      const n = parseFloat(p);
      if (n <= 3) result.lineHeight = n;
      else result.fontSize = n;
    } else if (p === 'normal') {
      result.fontWeight = 'normal';
      result.fontStyle = 'normal';
    } else if (p === 'bold') {
      result.fontWeight = 'bold';
    } else if (p === 'italic') {
      result.fontStyle = 'italic';
    } else if (p === 'exact') {
      result.whiteSpace = 'pre';
    } else if (p === 'bullet') {
      result.display = 'list-item';
      result.listStylePosition = 'inside';
    } else if (p === 'password') {
      result.password = true;
    } else if (['center', 'left', 'right'].includes(p)) {
      result.textAlign = p;
    } else {
      return true;
    }
  });
  if (parts.length > 0) result.fontFamily = parts.join(' ');
  return result;
};

const parseWidth = width => {
  const result = {} as any;
  split(width).forEach(p => {
    if (['left', 'center', 'right'].includes(p)) {
      result.side = p;
    } else if (isNumber(p)) {
      const n = parseFloat(p);
      if (n <= 1) result.width = `${n * 100}%`;
      else result.width = n;
      result.side = result.side || 'center';
    }
  });
  return result;
};

const parseHeight = height => {
  if (isNumber(height)) {
    const n = parseFloat(height);
    return n <= 1 ? `${n * 100}%` : `${n}px`;
  }
  return '';
};

export default ({ value, format, labels, ...values }, setters, parent) => {
  const { '': tag, ...other1 } = Object.keys(values).reduce(
    (res, k) =>
      typeof values[k] === 'string' ? { ...res, [k]: values[k] } : res,
    {} as any,
  );
  const {
    style,
    color,
    gap,
    width,
    height,
    top,
    middle,
    bottom,
    fill,
    pad,
    round,
    map,
    chart,
    inline,
    row,
    table,
    line,
    bar,
    radar,
    ring,
    pie,
    polar,
    ...other2
  } = {
    ...split(tag).reduce((res, t) => ({ ...res, [t]: true }), {}),
    ...other1,
  } as any;
  const { fontSize, lineHeight, textAlign, ...styleValues } = parseStyle(style);

  const result = {
    value,
    format,
    labels: Array.isArray(labels) ? labels : null,
    fontSize: fontSize || parent.fontSize,
    lineHeight: lineHeight || parent.lineHeight,
    textAlign: textAlign || parent.textAlign,
    ...styleValues,
    color: getColor(color),
    gap: toNumber(gap),
    ...parseWidth(width),
    height: parseHeight(height),
    align: (top && 'top') || (middle && 'middle') || (bottom && 'bottom'),
    fill: getColor(fill),
    pad: parseDirs(pad),
    round: parseDirs(round),
    ...other2,
  };

  let type = 'box';
  if (parent.type === 'table') type = 'tablerow';
  else if (map) type = 'map';
  else if (chart) type = 'chart';
  else if (setters.code) type = 'code';
  else if (result.image) type = 'image';
  else if (setters.input) type = 'input';
  else if (inline) type = 'inline';
  else if (row) type = 'row';
  else if (table) type = 'table';
  else if (result.gap) type = 'stack';

  return {
    type,
    ...(type === 'chart'
      ? {
          chartType:
            (bar && 'bar') ||
            (radar && 'radar') ||
            (ring && 'doughnut') ||
            (pie && 'pie') ||
            (polar && 'polarArea') ||
            'line',
        }
      : {}),
    ...Object.keys(result)
      .filter(k => result[k])
      .reduce((res, k) => ({ ...res, [k]: result[k] }), {} as any),
  };
};
