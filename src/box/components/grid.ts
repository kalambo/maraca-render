import Children from '../../children';
import { createNodes, getChildren, parseValue, unpackList } from '../../utils';

import getComponent from '../index';
import parse from '../parse';
import resize from '../resize';
import { toPx, updateNode } from '../utils';

export default class {
  node = createNodes('div')[0];
  gap;
  info;
  children = new Children(getComponent(true), childNodes => {
    const gap = this.gap || ['0', '0'];
    let count = 0;
    childNodes.forEach((row, i) => {
      updateNode(row, {
        style: {
          display: 'table-row',
          ...(i % 2 === 1 ? { height: toPx(gap[0]) } : {}),
        },
      });
      getChildren(row).forEach((cell, j) => {
        updateNode(cell, {
          style: {
            display: 'table-cell',
            ...(j % 2 === 1
              ? { width: toPx(gap[1]) }
              : this.info[count]
              ? {
                  ...this.info[count].box.props.style,
                  width: this.info[count].size.width,
                  verticalAlign: this.info[count].size.yAlign,
                }
              : {}),
          },
        });
        if (j % 2 === 0) count++;
      });
    });
  });
  constructor(setNode) {
    this.children.setNode(this.node);
    setNode(this.node);
  }
  update(data, { noWidth, ...context }) {
    const { values, indices } = unpackList(data.value);

    const style = parse.style(values, context);
    const box = parse.box(values);
    const size = parse.size(values, noWidth && 'auto');

    this.gap = parse.dirs(parseValue(values.gap, 'string'));
    const cols = parse.cols(values, indices.length);
    this.info = indices.map(d => {
      const v = d.type === 'value' ? {} : unpackList(d.value).values;
      return {
        box: parse.box(v),
        size: parse.size(v, cols.equal && `${100 / cols.cols}%`),
      };
    });
    this.children.setOptions(2, cols.cols || 1, true);
    this.children.update(indices, { ...style.context, noWidth: true });

    resize(this.node, values);
    updateNode(this.node, style.props, box.props, size.props, {
      style: {
        display: 'table',
        tableLayout: this.info.some(i => i.size.width !== 'auto')
          ? 'fixed'
          : 'auto',
        padding: toPx(box.pad),
      },
    });
  }
  dispose() {
    this.children.dispose();
  }
}
