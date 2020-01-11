import { createNodes, parseValue } from '../../utils';

import parse from '../parse';
import resize from '../resize';
import { updateNode } from '../utils';

export default class Image {
  nodes = createNodes('div', 'img');
  static getInfo(values, context) {
    const box = parse.box(values);
    const size = parse.size(values);
    return { props: { values, box, size }, context };
  }
  update({ values, box, size }) {
    const [node, img] = this.nodes;
    updateNode(img, {
      src: parseValue(values.image, 'string'),
      style: { width: '100%' },
    });
    resize(node, values);
    updateNode(node, box.props, size.props);
    return node;
  }
}
