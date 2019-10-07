import { fromJs } from 'maraca';

import { createNodes, getChildren, getSetters, parseValue } from '../../utils';

import pad from '../pad';
import parse from '../parse';
import resize from '../resize';
import { updateNode } from '../utils';

export default class Input {
  constructor(node) {
    createNodes(node, 'div', 'input');
  }
  static getInfo(values, context) {
    const { context: nextContext, ...style } = parse.style(values, context);
    const box = parse.box(values);
    const size = parse.size(values);
    const setters = getSetters(values, ['focus', 'input']);
    return { props: { values, style, box, size, setters }, context };
  }
  render(node, { values, style, box, size, setters }) {
    const middle = getChildren(node)[0];
    const inner = getChildren(middle)[0];

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

    resize(node, values);
    updateNode(node, box.props, size.props);
  }
}
