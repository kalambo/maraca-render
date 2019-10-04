import Children from '../../children';
import { createNodes, unpackList } from '../../utils';

import getComponent from '../index';
import parse from '../parse';
import { updateNode } from '../utils';

export default class {
  node = createNodes('span')[0];
  children = new Children(getComponent(false));
  constructor(setNode) {
    setNode(this.node);
    this.children.setNode(this.node);
  }
  update(data, { noWidth, ...context }) {
    const { values, indices } = unpackList(data.value);

    const style = parse.style(values, context);
    const box = parse.box(values);

    this.children.update(indices, style.context);

    updateNode(this.node, style.props, box.props);
  }
  dispose() {
    this.children.dispose();
  }
}
