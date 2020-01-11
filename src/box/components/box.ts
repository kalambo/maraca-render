import { Node } from 'maraca';

import updateChildren from '../../children';
import { createNodes } from '../../utils';

import getChild from '../index';
import pad from '../pad';
import parse from '../parse';
import resize from '../resize';
import { updateNode } from '../utils';

export default class Box extends Node {
  nodes = createNodes('div', 'div');
  static getChild = getChild;
  static getInfo(values, { display = 'block', width, ...context }) {
    const { context: nextContext, ...style } = parse.style(values, context);
    const box = parse.box(values);
    const size = parse.size(values, width);
    return {
      props: { values, style, box, size, display },
      context: { ...nextContext, inlineWrapped: true },
    };
  }
  update({ values, style, box, size, display }, children) {
    const [node, inner] = this.nodes;

    updateChildren(inner, children, 2);
    children.forEach(n => {
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

    return node;
  }
}
