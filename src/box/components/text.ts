import { createTextNode } from '../../utils';

export default class {
  node = createTextNode('');
  constructor(setNode) {
    setNode(this.node);
  }
  update(data) {
    this.node.nodeValue = data.value;
  }
}
