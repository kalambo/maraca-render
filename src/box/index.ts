import { parseValue, unpackData } from '../utils';

export default (data, context) => {
  if (data.type === 'value') return data.value ? components.Text : null;
  const { values } = unpackData(data);
  const tag = parseValue(values[''], 'string', '');
  if (context.components[tag]) return context.components[tag];
  if (context.flow || /\bflow\b/.test(parseValue(values.style, 'string'))) {
    return components.Flow;
  }
  if (parseValue(values.image, 'string')) return components.Image;
  if (values.input) return components.Input;
  if (parseValue(values.gap, 'string') || parseValue(values.cols, 'string')) {
    return components.Grid;
  }
  return components.Box;
};

import * as components from './components';

//   if (cols.rows) return 'table';
//   if (next === 'row') return 'row';
