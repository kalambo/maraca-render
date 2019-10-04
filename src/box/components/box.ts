import Children from '../../children';
import { createNodes, findChild, parseValue, unpackList } from '../../utils';

import getComponent from '../index';
import pad from '../pad';
import parse from '../parse';
import resize from '../resize';
import { updateNode } from '../utils';

const getValue = (data, context) => {
  if (
    data.type === 'value' ||
    context.flow ||
    /\bflow\b/.test(parseValue(unpackList(data.value).values.style, 'string'))
  ) {
    return [{ key: { type: 'value', value: '1' }, value: data }];
  }
  return data.value;
};

export default class {
  nodes = createNodes('div', 'div');
  pad;
  children = new Children(getComponent(false), childNodes => {
    childNodes.forEach(n => {
      const c = findChild(n, 2);
      c.parentNode.style.display =
        c.nodeType === 3 || c.tagName === 'SPAN' ? 'inline' : 'block';
      c.parentNode.parentNode.style.display =
        c.nodeType === 3 || c.tagName === 'SPAN' ? 'inline' : 'block';
    });
    pad.text(this.nodes[1], this.pad);
  });
  constructor(setNode) {
    this.children.setNode(this.nodes[1]);
    this.children.setOptions(2);
    setNode(this.nodes[0]);
  }
  update(data, { noWidth, ...context }) {
    const [node, inner] = this.nodes;
    const { values, indices } = unpackList(getValue(data, context));

    const style = parse.style(values, context);
    this.pad = style.pad;
    const box = parse.box(values);
    const size = parse.size(values, noWidth && 'auto');

    this.children.update(indices, style.context);

    updateNode(inner, style.props);
    pad.node(inner, 'pad', box.pad);

    resize(node, values);
    updateNode(node, box.props, size.props);
  }
  dispose() {
    this.children.dispose();
  }
}
