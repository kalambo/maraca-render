import updateChildren from './children';
import { disposeNode } from './update';

class Root {
  root;
  map = new Map();
  constructor(root) {
    this.root = root;
  }
  get(node, base = false) {
    if (!this.map.has(node)) {
      const rootNode = document.createElement('div');
      rootNode.style.zIndex = '0';
      if (base) {
        rootNode.style.position = 'relative';
        rootNode.style.height = '100%';
      } else {
        rootNode.style.position = 'fixed';
        rootNode.style.top = '0px';
        rootNode.style.left = '0px';
      }
      this.root.appendChild(rootNode);
      this.map.set(node, rootNode);
    }
    return this.map.get(node);
  }
  remove(node) {
    if (this.map.has(node)) {
      this.root.removeChild(this.map.get(node));
      this.map.delete(node);
    }
  }
}

export default (node) => {
  const root = new Root(node);
  const rootNode = root.get(node, true);
  return (data) => {
    if (data) {
      updateChildren(root, rootNode, [data]);
    } else {
      while (node.lastChild) {
        disposeNode(root, node.lastChild);
        node.removeChild(node.lastChild);
      }
    }
  };
};
