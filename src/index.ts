import getComponent from './box';
import updateChildNodes from './childNodes';
import Children from './children';

export { default as pad } from './box/pad';
export { default as parse } from './box/parse';
export { default as resize } from './box/resize';
export { updateNode } from './box/utils';
export { createNodes, getChildren, parseValue } from './utils';

export default (node, components = {}) => {
  class Base extends Children {
    static getComponent = getComponent;
    render(node, _, children) {
      updateChildNodes(node, children);
    }
  }
  const base = new Base();
  const arg = { component: Base, node, info: { context: { components } } };
  return data => {
    if (data) base.updateChildren(arg, !data.value ? [] : [data]);
    else base.disposeChildren();
  };
};
