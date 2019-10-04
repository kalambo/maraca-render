import { fromJs } from 'maraca';

import { getSetters, parseValue } from '../../utils';

import { toPx } from '../utils';

import parseColor from './color';
import parseDirs from './dirs';

export default values => {
  const setters = getSetters(values, ['hover', 'click', 'enter']);
  return {
    pad: parseDirs(parseValue(values.pad, 'string')) || [0, 0, 0, 0],
    props: {
      onmouseenter: setters.hover && (() => setters.hover(fromJs(true))),
      onmouseleave: setters.hover && (() => setters.hover(fromJs(false))),
      onmousedown:
        setters.click &&
        (e => {
          if (e.button === 0) setters.click(fromJs(null));
        }),
      onkeypress:
        setters.enter &&
        (e => {
          if (e.keyCode === 13) setters.enter(fromJs(null));
        }),
      style: {
        background: parseColor(parseValue(values.fill, 'string')),
        borderRadius: toPx(parseDirs(parseValue(values.round, 'string'))),
        ...(setters.click
          ? {
              overflow: 'hidden',
              cursor: 'pointer',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
            }
          : {}),
      },
    },
  };
};
