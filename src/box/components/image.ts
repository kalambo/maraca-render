import { createNodes, parseValue, unpackList } from '../../utils';

import resize from '../resize';
import parse from '../parse';
import { updateNode } from '../utils';

export default class {
  node = createNodes('img')[0];
  constructor(setNode) {
    setNode(this.node);
  }
  update(data) {
    const { values } = unpackList(data.value);

    const box = parse.box(values);
    const size = parse.size(values);

    resize(this.node, values);
    updateNode(this.node, box.props, size.props, {
      src: parseValue(values.image, 'string'),
      style: {
        width: '100%',
      },
    });
  }
}
