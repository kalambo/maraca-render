import { fromJs } from 'maraca';

import { createNodes, getSetters, parseValue, unpackList } from '../../utils';

import pad from '../pad';
import parse from '../parse';
import { updateNode } from '../utils';

export default class {
  nodes = createNodes('div', 'div', 'input');
  constructor(setNode) {
    setNode(this.nodes[0]);
  }
  update(data, { noWidth, ...context }) {
    const [node, middle, inner] = this.nodes;
    const { values } = unpackList(data.value);

    const style = parse.style(values, context);
    const box = parse.box(values);
    const setters = getSetters(values, ['focus', 'input']);

    updateNode(
      inner,
      { type: 'text' },
      style.props,
      setters.input && {
        value: parseValue(values.input, 'string', ''),
        oninput: e => setters.input(fromJs(e.target.value)),
        onfocus: setters.focus && (() => setters.focus(fromJs(true))),
        onblur: setters.focus && (() => setters.focus(fromJs(false))),
      },
    );
    if (parseValue(values.focus, 'boolean')) setTimeout(() => inner.focus());

    pad.text(middle, style.pad);
    pad.node(middle, 'pad', box.pad);

    updateNode(node, box.props);
  }
}
