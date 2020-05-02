import { applyObj, diffObjs } from './apply';
import { observeBox, unobserveBox, updateBoxes } from './box';

export class TextNode {
  type = 'text';
  node = document.createTextNode('');
  update(data) {
    this.node.textContent = data.value;
  }
}

export class Node {
  node;
  type;
  onBox;
  props;
  constructor(node, onBox) {
    this.node = node;
    this.type = node.nodeName.replace('#', '').toLowerCase();

    this.onBox = onBox;
    node.onscroll = updateBoxes;
  }
  runBox(run) {
    if (run) observeBox(this.node, this.onBox);
    else unobserveBox(this.node);
  }
  updateProps(next) {
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
