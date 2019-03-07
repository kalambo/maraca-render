export { updateBox } from './components';

import { getValues, unpackList, update, valueComponent } from '../utils';

import boxComponents from './components';
import parsers from './parsers';

const getBoxComp = (mode, vals, indices) => {
  if (mode === 'box' && vals[''] === 'text') return 'text';
  if (mode === 'text' && vals[''] !== 'box') return 'text';
  if (vals.image) return 'image';
  if (vals.input && vals.input.set) return 'input';
  const { cols } = parsers.cols(vals.cols, indices.length);
  if (vals.gap || cols) return 'cols';
  return 'box';
};

export default (components = {}) => {
  const getComp = (mode, data) => {
    if (data.type === 'value') return [valueComponent, () => [data]];
    const { values, indices } = unpackList(data.value);
    return getValues(
      values,
      {
        '': 'string',
        print: true,
        image: 'string',
        input: true,
        gap: 'string',
        cols: 'string',
      },
      vals => {
        if (components[vals['']]) {
          return [
            components[vals['']],
            context => [values, indices, updateNode(mode, context)],
          ];
        }
        return [
          boxComponents[getBoxComp(mode, vals, indices)],
          context => [values, indices, context, updateNode],
        ];
      },
    );
  };

  const updateNode = (mode, context, cols?) => (node, data) => {
    const [comp, args] = getComp(mode, data);
    if (cols === 1 || (cols && comp !== boxComponents.box)) {
      return update.components(node, boxComponents.box, [
        {},
        [{ type: 'value', value: '' }],
        context,
        (_, c) => n => update.components(n, comp, args(c)),
      ]);
    }
    return update.components(node, comp, args(context));
  };

  return updateNode('box', {});
};
