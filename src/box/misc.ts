import { toData } from 'maraca';

import parsers from './parsers';

export const toPx = s => {
  if (!s) return null;
  if (!Array.isArray(s)) return `${s}px`;
  return s.map(x => toPx(x || '0')).join(' ');
};

export const textConfig = { style: 'string', color: 'string' };
export const textInfo = (values, context, forceHeight = false) => {
  const { fontSize, lineHeight, password, ...styleValues } = parsers.style(
    values.style,
  );
  const size = fontSize || context.size || 20;
  const height = forceHeight ? 1.5 : lineHeight || context.height || 1.5;
  return {
    pad: Math.floor(size * (height - 1)) * -0.5,
    info: { size, height },
    props: {
      ...(password ? { type: 'password' } : {}),
      style: {
        fontSize: toPx(size),
        minHeight: toPx(size),
        lineHeight: toPx(Math.floor(height * size)),
        ...styleValues,
        color: parsers.color(values.color),
      },
    },
  };
};

export const boxConfig = {
  fill: 'string',
  pad: 'string',
  round: 'string',
};
export const boxInfo = values => ({
  pad: parsers.dirs(values.pad),
  props: {
    style: {
      background: parsers.color(values.fill),
      borderRadius: toPx(parsers.dirs(values.round)),
    },
  },
});

export const boxSetters = {
  setters: {
    hover: set => ({
      onmouseenter: set && (() => set(toData(true))),
      onmouseleave: set && (() => set(toData(false))),
    }),
    click: (set, values) => ({
      onmousedown: set && (() => set(values().value || toData(null))),
    }),
    enter: (set, values) => ({
      onkeypress:
        set &&
        (e => {
          if (e.keyCode === 13) set(values().value || toData(null));
        }),
    }),
  },
  config: {
    value: true,
  },
};
