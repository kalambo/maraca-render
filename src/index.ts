import { update } from './utils';

export { default as box, updateBox } from './box';
export { createNode, dom, getSetters, getValues, parseValue } from './utils';

export default (render, node) => data => {
  const scroll = window.scrollY;
  update.children(
    node,
    [{ type: 'list', value: { indices: [data], values: {} } }],
    render,
  );
  window.scrollTo(0, scroll);
};
