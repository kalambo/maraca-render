import { Node } from 'maraca';

import updateChildren from '../../children';
import { createNodes, getChildren, parseValue } from '../../utils';

import getChild from '../index';
import parse from '../parse';
import resize from '../resize';
import { toPx, updateNode, wrapInList } from '../utils';

import Box from './box';

export default class Grid extends Node {
  nodes = createNodes('div');
  static getChild(data, context) {
    return getChild(data, context) === Box ? Box : wrapInList(data, 'y');
  }
  static getInfo(values, context, childCount) {
    const { context: nextContext, ...style } = parse.style(values, context);
    const box = parse.box(values);
    const size = parse.size(values);
    const gap = parse.dirs(parseValue(values.gap, 'string'));
    const cols = parse.cols(values, childCount);
    return {
      props: { values, style, box, size, gap, cols },
      context: {
        ...nextContext,
        display: 'table-cell',
        width: cols.equal && `${100 / cols.cols}%`,
      },
    };
  }
  update({ values, style, box, size, gap, cols }, children) {
    const [node] = this.nodes;
    updateChildren(node, children, 1, cols.cols || 1, true);
    getChildren(node).forEach((row, i) => {
      row.style.display = 'table-row';
      if (i % 2 === 1) row.style.height = toPx(gap ? gap[0] : '0');
      getChildren(row).forEach((cell, j) => {
        cell.style.display = 'table-cell';
        if (j % 2 === 1) cell.style.width = toPx(gap ? gap[1] : '0');
      });
    });

    resize(node, values);
    updateNode(node, style.props, box.props, size.props, {
      style: {
        display: 'table',
        tableLayout:
          childProps.some(p => p.size && p.size.width !== 'auto') ||
          cols.equal ||
          gap
            ? 'fixed'
            : 'auto',
        padding: toPx(box.pad),
      },
    });

    return node;
  }
}
