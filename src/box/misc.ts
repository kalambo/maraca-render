import { toData } from 'maraca';

import parsers from './parsers';

export const toPx = s => {
  if (!s) return null;
  if (!Array.isArray(s)) return `${s}px`;
  return s.map(toPx).join(' ');
};

export const textConfig = { style: 'string', color: 'string' };
export const textInfo = (values, context) => {
  const { fontSize, lineHeight, ...styleValues } = parsers.style(values.style);
  const size = fontSize || context.size || 20;
  const height = lineHeight || context.height || 1.5;
  return {
    pad: Math.floor(size * (height - 1)) * -0.5,
    info: { size, height },
    props: {
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
  hover: set => ({
    onmouseenter: set && (() => set(toData(true))),
    onmouseleave: set && (() => set(toData(false))),
  }),
  click: (set, { value }) => ({
    onmousedown: set && (() => set(value || toData(null))),
  }),
  enter: (set, { value }) => ({
    onkeypress:
      set &&
      (e => {
        if (e.keyCode === 13) set(value || toData(null));
      }),
  }),
};
