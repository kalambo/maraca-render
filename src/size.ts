import { isNumber, parseValue, split } from './utils';

export default values => {
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
  result.xAlign = result.xAlign || 'center';

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
    width: ['left', 'right'].includes(result.xAlign) ? 'auto' : '100%',
    maxWidth: result.width || 'auto',
    height: result.height,
    float: ['left', 'right'].includes(result.xAlign) ? result.xAlign : 'none',
    marginLeft: result.xAlign !== 'left' ? 'auto' : '',
    marginRight: result.xAlign !== 'right' ? 'auto' : '',
  };
};
