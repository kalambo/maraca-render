import { parseValue, unpackList } from '../utils';

import * as components from './components';

const getComponent = (data, context) => {
  if (data.type === 'value') return data.value ? components.Text : null;
  const { values } = unpackList(data.value);
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

export default wrapInline => (data, context) => {
  const result = getComponent(data, context);
  if (wrapInline && [components.Flow, components.Text].includes(result)) {
    return components.Box;
  }
  return result;
};

//   if (cols.rows) return 'table';
//   if (next === 'row') return 'row';
