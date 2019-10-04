import Children from './children';
import getComponent from './box';

export { default as pad } from './box/pad';
export { default as parse } from './box/parse';
export { default as resize } from './box/resize';
export { updateNode } from './box/utils';
export { createNodes, parseValue, unpackList } from './utils';

export default (node, components = {}) => {
  const children = new Children(getComponent(true));
  children.setNode(node);
  return data => {
    if (data) children.update(!data.value ? [] : [data], { components });
    else children.dispose();
  };
};
