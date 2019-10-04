import { parseValue } from '../../utils';

import { isNumber, split } from '../utils';

export default (values, forceWidth?) => {
  const result = {} as any;

  split(parseValue(values.x, 'string')).forEach(p => {
    if (['left', 'middle', 'right'].includes(p)) {
      result.xAlign = p === 'middle' ? 'center' : p;
    } else if (isNumber(p)) {
      const n = parseFloat(p);
      if (n <= 1) result.width = `${n * 100}%`;
      else result.width = `${n}px`;
    }
  });
  if (forceWidth) result.width = forceWidth;
  if (result.width) result.xAlign = result.xAlign || 'center';
  if (!result.width) result.width = 'auto';

  split(parseValue(values.y, 'string')).forEach(p => {
    if (['top', 'middle', 'bottom'].includes(p)) {
      result.yAlign = p;
    } else if (isNumber(p)) {
      const n = parseFloat(p);
      if (n <= 1) result.height = `${n * 100}%`;
      else result.height = `${n}px`;
    }
  });
  result.yAlign = result.yAlign || (result.height ? 'middle' : 'top');

  return {
    ...result,
    props: {
      style: {
        width: ['left', 'right'].includes(result.xAlign) ? 'auto' : '100%',
        maxWidth: result.width,
        height: result.height,
        float: ['left', 'right'].includes(result.xAlign)
          ? result.xAlign
          : 'none',
        marginLeft: result.xAlign !== 'left' ? 'auto' : '',
        marginRight: result.xAlign !== 'right' ? 'auto' : '',
      },
    },
  };
};
