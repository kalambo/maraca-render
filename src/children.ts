import { createNodes, findChild, getChildren } from './utils';

const batchFunc = func => {
  let running = false;
  return () => {
    if (!running) {
      running = true;
      setTimeout(() => {
        running = false;
        func();
      });
    }
  };
};

class ChildNodes {
  getComponent;
  onUpdate;
  updater;
  data = [] as any[];
  components = [] as any[];
  nodes = [] as any[];
  constructor(getComponent, onUpdate) {
    this.getComponent = getComponent;
    this.onUpdate = onUpdate;
    this.updater = batchFunc(() => onUpdate(true));
  }
  update(indices, context) {
    let hasUpdated = false;
    for (
      let i = Math.max(this.components.length, indices.length) - 1;
      i >= 0;
      i--
    ) {
      const comp = indices[i] && this.getComponent(indices[i], context);
      if (comp) {
        if (!(this.components[i] instanceof comp)) {
          hasUpdated = true;
          if (this.components[i] && this.components[i].dispose) {
            this.components[i].dispose();
          }
          this.data[i] = null;
          this.components[i] = comp;
          this.nodes[i] = null;
          this.components[i] = new comp(n => {
            this.nodes[i] = n;
            this.updater();
          });
        }
        if (indices[i] !== this.data[i]) {
          this.components[i].update(indices[i], context);
          this.data[i] = indices[i];
        }
      } else {
        hasUpdated = true;
        if (this.components[i] && this.components[i].dispose) {
          this.components[i].dispose();
        }
        this.data.splice(i, 1);
        this.components.splice(i, 1);
        this.nodes.splice(i, 1);
      }
    }
    this.onUpdate(hasUpdated);
  }
  dispose() {
    this.nodes.forEach(n => n.dispose && n.dispose());
  }
}

const appendChild = (parent, child, spacers) => {
  if (spacers && parent.childNodes.length > 0) {
    parent.appendChild(createNodes('div')[0]);
  }
  parent.appendChild(child);
};
const removeChild = (child, spacers) => {
  const parent = child.parentNode;
  if (spacers) {
    const j = [...parent.childNodes].indexOf(child);
    if (j > 0) parent.removeChild(parent.childNodes[j - 1]);
  }
  parent.removeChild(child);
};

const updateChildren = (node, children, depth, group, spacers) => {
  const dep = depth - (group ? 1 : 0);
  const rows = getChildren(node).filter((_, i) => !spacers || i % 2 === 0);
  const childNodes = group
    ? rows.reduce(
        (res, n) => [
          ...res,
          ...getChildren(n).filter((_, i) => !spacers || i % 2 === 0),
        ],
        [],
      )
    : rows;
  children.forEach((next, index) => {
    let child = childNodes.splice(0, 1)[0];
    const prev = child && findChild(child, dep);
    if (!next) {
      if (child) removeChild(child, spacers);
    } else {
      let parent = group ? rows[Math.floor(index / group)] : node;
      if (!parent) {
        parent = createNodes('div')[0];
        appendChild(node, parent, spacers);
        rows.push(parent);
      }
      if (!prev) {
        child = createNodes(
          ...Array.from({ length: dep }).map(() => 'div'),
          next,
        )[0];
        appendChild(parent, child, spacers);
      } else {
        if (next !== prev) prev.parentNode.replaceChild(next, prev);
        if (!dep) child = next;
        if (child.parentNode !== parent) {
          removeChild(child, spacers);
          appendChild(parent, child, spacers);
        }
      }
    }
  });
  childNodes.forEach(child => {
    removeChild(child, spacers);
  });
  if (group) {
    rows.forEach(r => {
      if (getChildren(r).length === 0) removeChild(r, spacers);
    });
  }
};

export default class Children {
  node;
  options: [any, any, any] = [] as any;
  childNodes;
  onUpdate;
  constructor(getComponent, onUpdate?) {
    this.childNodes = new ChildNodes(getComponent, changed => {
      if (changed && this.node) {
        updateChildren(
          this.node,
          this.childNodes.nodes.filter(x => x),
          ...this.options,
        );
      }
      if (onUpdate) onUpdate(getChildren(this.node));
    });
    this.onUpdate = onUpdate;
  }
  setNode(node) {
    if (this.node && node) {
      while (this.node.childNodes.length) {
        node.appendChild(this.node.firstChild);
      }
    }
    this.node = node;
  }
  setOptions(depth = 0, group = 0, spacers = false) {
    const newOptions = [depth, group, spacers] as any;
    if (this.node && newOptions.some((x, i) => x !== this.options[i])) {
      this.options = newOptions;
      while (this.node.childNodes.length) {
        this.node.removeChild(this.node.firstChild);
      }
      updateChildren(
        this.node,
        this.childNodes.nodes.filter(x => x),
        ...this.options,
      );
      if (this.onUpdate) this.onUpdate(getChildren(this.node));
    }
  }
  update(indices, context) {
    this.childNodes.update(indices, context);
  }
  dispose() {
    this.childNodes.dispose();
  }
}
