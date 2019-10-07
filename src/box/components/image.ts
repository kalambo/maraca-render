import { createNodes, getChildren, parseValue } from '../../utils';

import parse from '../parse';
import resize from '../resize';
import { updateNode } from '../utils';

export default class Image {
  constructor(node) {
    createNodes(node, 'img');
  }
  static getInfo(values, context) {
    const box = parse.box(values);
    const size = parse.size(values);
    return { props: { values, box, size }, context };
  }
  render(node, { values, box, size }) {
    updateNode(getChildren(node)[0], {
      src: parseValue(values.image, 'string'),
      style: { width: '100%' },
    });
    resize(node, values);
    updateNode(node, box.props, size.props);
  }
}
