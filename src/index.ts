import { updateChildren } from './core';

export { default as box } from './box';
export { default as dom } from './dom';

export default (modes, node, data) => {
  updateChildren(modes.reduce((res, m) => m(res), {}), 'box', node, [
    { type: 'list', value: { indices: [data], values: {} } },
  ]);
  return node;
};
