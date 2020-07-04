import { applyObj, diffObjs } from './apply';
import { observeBox, unobserveBox, updateBoxes } from './box';

export class TextNode {
  type = 'text';
  element;
  constructor(element = document.createTextNode('')) {
    this.element = element;
  }
  update(data) {
    this.element.textContent = data.value;
  }
  dispose() {}
}

export class Node {
  element;
  type;
  props;
  constructor(element) {
    this.element = element;
    this.type = element.nodeName.toLowerCase();
    this.props = [...element.attributes].reduce(
      (res, a) => ({
        ...res,
        [a.name]:
          a.name === 'style'
            ? a.value
                .split(';')
                .filter((s) => s.trim())
                .reduce((r, s) => {
                  const [k, v] = s.split(':');
                  return { ...r, [k.trim()]: v.trim() };
                }, {})
            : a.value,
      }),
      {},
    );
    element.onscroll = updateBoxes;
  }
  updateProps({ onbox, ...next }) {
    if (onbox) observeBox(this.element, onbox);
    else unobserveBox(this.element);
    applyObj(this.element, diffObjs(next, this.props || {}), true);
    this.props = next;
  }
  updateChildren(nodes = [] as any[]) {
    [...this.element.childNodes]
      .filter((n) => n.nodeName === '#comment')
      .forEach((n) => this.element.removeChild(n));
    const prev = [...this.element.childNodes];
    const next = nodes.map((n) => n.element);
    for (let i = 0; i < Math.max(prev.length, next.length); i++) {
      if (!next[i]) {
        this.element.removeChild(prev[i]);
      } else {
        if (!prev[i]) {
          this.element.appendChild(next[i]);
        } else if (next[i] !== prev[i]) {
          this.element.replaceChild(next[i], prev[i]);
        }
      }
    }
  }
  focus() {
    this.element.focus();
  }
  dispose() {
    unobserveBox(this.element);
  }
}
