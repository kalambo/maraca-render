import { createNodes, createTextNode, shallowEqual, unpackData } from './utils';

const dispose = c => {
  if (c && c.disposeChildren) c.disposeChildren();
  if (c && c.dispose) c.dispose();
};

const getComponentBase = (parent, data, context) => {
  if (!data) return {};
  const result = parent.getComponent(data, context);
  if (typeof result === 'function') return { component: result, data };
  return getComponentBase(parent, result, context);
};
const getComponent = (parent, data, context) => {
  const result = getComponentBase(parent, data, context);
  if (result.component && result.component.wrapComponent) {
    const wrapped = result.component.wrapComponent(
      parent,
      result.data,
      context,
    );
    if (wrapped) return getComponent(parent, wrapped, context);
  }
  return result;
};

export default class Children {
  children = [] as any[];
  indices = [];
  info;
  constructor() {}
  getComponent(..._): any {}
  render(..._) {}
  updateChildren({ component, node, info }, indices) {
    let hasUpdated = false;
    for (
      let i = Math.max(this.children.length, indices.length) - 1;
      i >= 0;
      i--
    ) {
      if (indices[i] !== this.indices[i] || info !== this.info) {
        hasUpdated = true;
        if (i < indices.length) this.children[i] = this.children[i] || {};
        const { component: comp, data } = getComponent(
          component,
          indices[i],
          info.context,
        );
        if (comp) {
          if (!(this.children[i].component === comp)) {
            dispose(this.children[i].instance);
            const newNode =
              comp.nodeType === 'text'
                ? createTextNode('')
                : createNodes(comp.nodeType || 'div')[0];
            if (newNode.dataset) newNode.dataset.component = comp.name;
            this.children[i] = {
              component: comp,
              node: newNode,
              instance: new comp(newNode),
            };
          }
          const unpacked = unpackData(
            data,
            !!this.children[i].instance.updateChildren,
          );
          if (
            !(
              shallowEqual(this.children[i].values, unpacked.values) &&
              this.children[i].childCount === unpacked.indices.length
            )
          ) {
            this.children[i].info = comp.getInfo
              ? comp.getInfo(
                  unpacked.values,
                  info.context,
                  unpacked.indices.length,
                )
              : { props: unpacked.values, context: info.context };
            this.children[i].values = unpacked.values;
            this.children[i].childCount = unpacked.indices.length;
          }
          if (this.children[i].instance.updateChildren) {
            this.children[i].instance.updateChildren(
              this.children[i],
              unpacked.indices,
            );
          } else {
            this.children[i].instance.render(
              this.children[i].node,
              this.children[i].info.props,
              this.children[i].info.context,
            );
          }
        } else {
          dispose(this.children[i] && this.children[i].instance);
          if (i < indices.length) this.children[i] = {};
          else this.children.splice(i, 1);
        }
      }
    }
    if (hasUpdated) {
      this.render(
        node,
        info.props,
        this.children.filter(c => c.node).map(c => c.node),
        this.children.filter(c => c.node).map(c => c.info.props),
        info.context,
      );
    }
    this.indices = indices;
    this.info = info;
  }
  disposeChildren() {
    this.children.forEach(c => dispose(c.instance));
  }
}
