import { fromJs } from 'maraca';

import parseColor from './color';
import {
  getSetters,
  getValues,
  isInteger,
  isNumber,
  split,
  toNumber,
  toPx,
} from './utils';

const parseDirs = (s = '') => {
  const parts = split(s);
  if (parts.length === 0) return null;
  return [
    parts[0] || 0,
    parts[3] || parts[1] || parts[0] || 0,
    parts[2] || parts[0] || 0,
    parts[1] || parts[0] || 0,
  ].map(toNumber);
};

const parseCols = (s = '', childCount) => {
  const result = {} as any;
  split(s).forEach(p => {
    if (p === 'all') result.cols = childCount;
    else if (p === 'equal') result.equal = true;
    else if (p === 'rows') result.rows = true;
    else if (isInteger(p)) result.cols = toNumber(p);
  });
  if (result.equal) result.cols = result.cols || childCount;
  return result.rows || result.cols ? result : {};
};

const parseStyle = (s = '') => {
  const result = {} as any;
  const numbers = [] as number[];
  const parts = split(s).filter(p => {
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
  return result;
};

const parseX = (s = '') => {
  const result = {} as any;
  split(s).forEach(p => {
    if (['left', 'middle', 'right'].includes(p)) {
      result.xAlign = p === 'middle' ? 'center' : p;
    } else if (isNumber(p)) {
      const n = parseFloat(p);
      if (n <= 1) result.width = `${n * 100}%`;
      else result.width = `${n}px`;
    }
  });
  if (result.width) result.xAlign = result.xAlign || 'center';
  return result;
};

const parseY = (s = '') => {
  const result = {} as any;
  split(s).forEach(p => {
    if (['top', 'middle', 'bottom'].includes(p)) {
      result.yAlign = p;
    } else if (isNumber(p)) {
      const n = parseFloat(p);
      if (n <= 1) result.height = `${n * 100}%`;
      else result.height = `${n}px`;
    }
  });
  result.yAlign = result.yAlign || (result.height ? 'middle' : 'top');
  return result;
};

export default (values, indices, context) => {
  const vals = getValues(values, {
    cols: 'string',
    gap: 'string',
    style: 'string',
    color: 'string',
    x: 'string',
    y: 'string',
    fill: 'string',
    pad: 'string',
    round: 'string',
    image: 'string',
    input: 'string',
    focus: 'boolean',
  });
  const setters = getSetters(values, [
    'x',
    'y',
    'hover',
    'click',
    'enter',
    'focus',
    'input',
  ]);

  const { flow, fontSize, lineHeight, password, ...styleValues } = parseStyle(
    vals.style,
  );
  const textFlow = context.flow || flow || false;
  const textSize = fontSize || context.size || 20;
  const textHeight = setters.input ? 1.5 : lineHeight || context.height || 1.5;

  const cols = parseCols(vals.cols, indices.length);
  const gap = parseDirs(vals.gap);
  const size = {
    ...(vals.x && !values.x.wasSet ? parseX(vals.x) : {}),
    ...(vals.y && !values.y.wasSet ? parseY(vals.y) : {}),
    ...(context.width ? { width: context.width } : {}),
    setWidth: setters.x,
    setHeight: setters.y,
  };

  return {
    info: {
      flow: textFlow,
      cols,
      gap,
      size,
      image: vals.image,
      input: setters.input && {
        value: vals.input,
        oninput: e => setters.input(fromJs(e.target.value)),
        onfocus: setters.focus && (() => setters.focus(fromJs(true))),
        onblur: setters.focus && (() => setters.focus(fromJs(false))),
      },
      focus: vals.focus,
      text: {
        pad: Math.floor(textSize * (textHeight - 1)) * -0.5,
        props: {
          ...(password ? { type: 'password' } : {}),
          style: {
            fontSize: `${textSize}px`,
            minHeight: `${textSize}px`,
            lineHeight: `${Math.floor(textHeight * textSize)}px`,
            ...styleValues,
            color: parseColor(vals.color),
          },
        },
      },
      box: {
        pad: parseDirs(vals.pad) || [],
        props: {
          onmouseenter: setters.hover && (() => setters.hover(fromJs(true))),
          onmouseleave: setters.hover && (() => setters.hover(fromJs(false))),
          onmousedown: setters.click && (() => setters.click(fromJs(null))),
          onkeypress:
            setters.enter &&
            (e => {
              if (e.keyCode === 13) setters.enter(fromJs(null));
            }),
          style: {
            overflow: 'hidden',
            background: parseColor(vals.fill),
            borderRadius: toPx(parseDirs(vals.round)),
            ...(setters.click ? { cursor: 'pointer' } : {}),
          },
        },
      },
    },
    context: {
      next: cols.rows ? 'row' : null,
      wrap: cols.cols === 1,
      flow: textFlow,
      size: textSize,
      height: textHeight,
      width: cols.equal && `${100 / cols.cols}%`,
    },
  };
};
