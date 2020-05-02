import { Node } from './node';
import { Children } from './util';

export default (root) => {
  const node = new Node(root, null);
  const children = new Children();
  return (data) => {
    if (data) {
      node.updateChildren(children.update([data]));
    } else {
      children.dispose();
      node.updateChildren([]);
    }
  };
};
