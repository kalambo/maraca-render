import { fromJs } from 'maraca';

import Children from '../../children';
import updateChildNodes from '../../childNodes';
import { getChildren, parseValue } from '../../utils';

import getComponent from '../index';
import parse from '../parse';
import resize from '../resize';
import { toPx, updateNode, extendList } from '../utils';

import Row from './row';

export default class Table extends Children {
  static getComponent(data, context) {
    return getComponent(data, context) === Row
      ? Row
      : extendList(data, [{ key: fromJs('cols'), value: fromJs('table-row') }]);
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
  render(
    node,
    { values, style, box, size, gap, cols },
    childNodes,
    childProps,
  ) {
    updateChildNodes(node, childNodes, 0, 0, true);
    getChildren(node).forEach((row, i) => {
      row.style.display = 'table-row';
      if (i % 2 === 1) row.style.height = toPx(gap ? gap[0] : '0');
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
  }
}
