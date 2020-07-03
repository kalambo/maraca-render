import { Node } from './node';
import { Children } from './util';

class Portal {
  root;
  nodeMap = new Map();
  constructor(root) {
    this.root = root;
  }
  render(node, childNodes) {
    if (childNodes) {
      if (!this.nodeMap.has(node)) {
        const nodeRoot = document.createElement('div');
        this.root.appendChild(nodeRoot);
        this.nodeMap.set(node, new Node(nodeRoot));
      }
      this.nodeMap.get(node).updateChildren(childNodes);
    } else {
      if (this.nodeMap.has(node)) {
        this.nodeMap.get(node).dispose();
        this.root.removeChild(this.nodeMap.get(node).node);
        this.nodeMap.delete(node);
      }
    }
  }
}

export default (root, portals = {}) => {
  const node = new Node(root);
  const portalRenders = Object.keys(portals).reduce(
    (res, k) => ({ ...res, [k]: new Portal(portals[k]) }),
    {},
  );
  const children = new Children();
  return (data) => {
    if (data) {
      node.updateChildren(children.update([data], portalRenders)['']);
    } else {
      children.dispose(portalRenders);
      node.updateChildren([]);
    }
  };
};
