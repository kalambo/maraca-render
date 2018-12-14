import { getValues, update } from '../utils';

import boxComponents from './components';
import parsers from './parsers';

export default components => {
  const updateNode = (mode, context) =>
    update.list((node, values, indices) =>
      update.components(
        node,
        components,
        getValues(values, { '': 'string' })[''],
        'component',
        [values, indices, updateNode(mode, context)],
        () =>
          update.components(
            node,
            boxComponents(updateNode),
            getValues(
              values,
              {
                '': 'string',
                image: 'string',
                input: true,
                gap: 'string',
                cols: 'string',
              },
              vals => {
                if (mode === 'box' && vals[''] === 'text') return 'text';
                if (mode === 'text' && vals[''] !== 'box') return 'text';
                if (vals.image) return 'image';
                if (vals.input && vals.input.set) return 'input';
                const { cols } = parsers.cols(vals.cols, indices.length);
                if (vals.gap || cols) return 'cols';
                return 'box';
              },
            ),
            'box',
            [values, indices, context],
          ),
      ),
    );

  return updateNode('box', {});
};
