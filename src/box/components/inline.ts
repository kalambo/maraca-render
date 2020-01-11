import { Node } from 'maraca';

import updateChildren from '../../children';
import { createNodes, createTextNode } from '../../utils';

import parse from '../parse';
import { updateNode } from '../utils';

// const [node, inner] = this.nodes;

// updateChildren(inner, children, 2);
// children.forEach(n => {
//   n.parentNode.style.display =
//     n.nodeType === 3 || n.tagName === 'SPAN' ? 'inline' : 'block';
//   n.parentNode.parentNode.style.display =
//     n.nodeType === 3 || n.tagName === 'SPAN' ? 'inline' : 'block';
// });

// updateNode(inner, style.props);
// pad.node(inner, 'pad', box.pad);
// pad.text(inner, style.pad);

// resize(node, values);
// updateNode(node, box.props, size.props, {
//   style: {
//     display,
//     ...(display !== 'block'
//       ? { width: size.width, verticalAlign: size.yAlign }
//       : {}),
//   },
// });

export class Value {
  node = createTextNode('');
  static getInfo(value, { inlineWrapped, ...context }) {
    return { props: { value, wrap: !inlineWrapped }, context: context };
  }
  update({ value, wrap }) {
    this.node.nodeValue = value;
    return this.node;
  }
}

export class Flow extends Node {
  node = createNodes('span')[0];
  static getChild(data) {
    if (data.type === 'value') return data.value ? Text : null;
    return Flow;
  }
  static getInfo(values, { inlineWrapped, ...context }) {
    const { context: nextContext, ...style } = parse.style(values, context);
    const box = parse.box(values);
    return {
      props: { style, box, wrap: !inlineWrapped },
      context: { ...nextContext, inlineWrapped: true },
    };
  }
  update({ style, box, wrap }, children) {
    updateChildren(this.node, children);
    updateNode(this.node, style.props, box.props);
    return this.node;
  }
}
