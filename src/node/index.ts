import { applyObj, diffObjs } from './apply';
import { observeBox, unobserveBox, updateBoxes } from './box';

export class TextNode {
  type = 'text';
  node = document.createTextNode('');
  update(data) {
    this.node.textContent = data.value;
  }
  dispose() {}
}

export class Node {
  node;
  type;
  props;
  constructor(node) {
    this.node = node;
    this.type = node.nodeName.replace('#', '').toLowerCase();
    node.onscroll = updateBoxes;
  }
  updateProps({ onbox, ...next }) {
    if (onbox) observeBox(this.node, onbox);
    else unobserveBox(this.node);
    applyObj(this.node, diffObjs(next, this.props || {}), true);
    this.props = next;
  }
  updateChildren(nodes) {
    const prev = [...this.node.childNodes];
    const next = nodes.map((n) => n.node);
    for (let i = 0; i < Math.max(prev.length, next.length); i++) {
      if (!next[i]) {
        this.node.removeChild(prev[i]);
      } else {
        if (!prev[i]) {
          this.node.appendChild(next[i]);
        } else if (next[i] !== prev[i]) {
          this.node.replaceChild(next, prev);
        }
      }
    }
  }
  focus() {
    this.node.focus();
  }
  dispose() {
    unobserveBox(this.node);
  }
}
