import { update } from './utils';

export { default as box, updateBox } from './box';
export { createNode, dom, getSetters, getValues, parseValue } from './utils';

export default (render, node) => data => {
  const child = node.childNodes[0];
  const scroll = child && child.scrollY;
  update.children(
    node,
    [
      {
        type: 'list',
        value: { indices: data.type === 'nil' ? [] : [data], values: {} },
      },
    ],
    render,
  );
  if (child) child.scrollTo(0, scroll);
};
