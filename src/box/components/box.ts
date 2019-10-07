import Children from '../../children';
import updateChildNodes from '../../childNodes';
import { createNodes, getChildren } from '../../utils';

import getComponent from '../index';
import pad from '../pad';
import parse from '../parse';
import resize from '../resize';
import { updateNode } from '../utils';

export default class Box extends Children {
  constructor(node) {
    super();
    createNodes(node, 'div');
  }
  static getComponent = getComponent;
  static getInfo(values, { display = 'block', width, ...context }) {
    const { context: nextContext, ...style } = parse.style(values, context);
    const box = parse.box(values);
    const size = parse.size(values, width);
    return {
      props: { values, style, box, size, display },
      context: nextContext,
    };
  }
  render(node, { values, style, box, size, display }, childNodes) {
    const inner = getChildren(node)[0];

    updateChildNodes(inner, childNodes, 2);
    childNodes.forEach(n => {
      n.parentNode.style.display =
        n.nodeType === 3 || n.tagName === 'SPAN' ? 'inline' : 'block';
      n.parentNode.parentNode.style.display =
        n.nodeType === 3 || n.tagName === 'SPAN' ? 'inline' : 'block';
    });

    updateNode(inner, style.props);
    pad.node(inner, 'pad', box.pad);
    pad.text(inner, style.pad);

    resize(node, values);
    updateNode(node, box.props, size.props, {
      style: {
        display,
        ...(display !== 'block'
          ? { width: size.width, verticalAlign: size.yAlign }
          : {}),
      },
    });
  }
}
