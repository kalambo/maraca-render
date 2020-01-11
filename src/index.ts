import getChild from './box';
import updateChildren from './children';

import { Node } from 'maraca';

export { default as pad } from './box/pad';
export { default as parse } from './box/parse';
export { default as resize } from './box/resize';
export { updateNode } from './box/utils';
export { createNodes, getChildren, parseValue } from './utils';

export default (node, components = {}) => {
  return class Base extends Node {
    static getChild = getChild;
    static getInfo() {
      return { props: {}, context: { components } };
    }
    update(_, children) {
      updateChildren(node, children);
    }
  };
};
