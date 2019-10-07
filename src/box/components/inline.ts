import Children from '../../children';
import updateChildNodes from '../../childNodes';

import parse from '../parse';
import { updateNode, wrapInList } from '../utils';

import Box from './box';

const wrapComponent = (parent, data) =>
  ![Box, Flow, Text].includes(parent) && wrapInList(data);

export class Text {
  static nodeType = 'text';
  static wrapComponent = wrapComponent;
  render(node, value) {
    node.nodeValue = value;
  }
}

export class Flow extends Children {
  static nodeType = 'span';
  static wrapComponent = wrapComponent;
  static getComponent(data) {
    if (data.type === 'value') return data.value ? Text : null;
    return Flow;
  }
  static getInfo(values, context) {
    const { context: nextContext, ...style } = parse.style(values, context);
    const box = parse.box(values);
    return { props: { style, box }, context: nextContext };
  }
  render(node, { style, box }, childNodes) {
    updateChildNodes(node, childNodes);
    updateNode(node, style.props, box.props);
  }
}
