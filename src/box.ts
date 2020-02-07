import { fromJs } from 'maraca';

import parseColor from './color';
import { getPushers, parseDirs, parseValue, toPx } from './utils';

export default values => {
  const pushers = getPushers(values, ['hover', 'click', 'enter']);
  return {
    round: parseDirs(parseValue(values.round, 'string')),
    pad: parseDirs(parseValue(values.pad, 'string')) || [0, 0, 0, 0],
    onmouseenter: pushers.hover && (() => pushers.hover(fromJs(true))),
    onmouseleave: pushers.hover && (() => pushers.hover(fromJs(false))),
    onmousedown:
      pushers.click &&
      (e => {
        if (e.button === 0) pushers.click(fromJs(null));
      }),
    onkeypress:
      pushers.enter &&
      (e => {
        if (e.keyCode === 13) pushers.enter(fromJs(null));
      }),
    style: {
      background: parseColor(parseValue(values.fill, 'string')),
      borderRadius: toPx(parseDirs(parseValue(values.round, 'string'))),
      ...(pushers.click
        ? {
            overflow: 'hidden',
            cursor: 'pointer',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
          }
        : {}),
    } as any,
  };
};
