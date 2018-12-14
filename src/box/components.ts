import { toData } from 'maraca';

import {
  applyObj,
  createNode,
  findChild,
  getChildren,
  getSetters,
  getValues,
  mergeObjs,
  parseValue,
  update,
} from '../utils';

import {
  boxConfig,
  boxInfo,
  boxSetters,
  textConfig,
  textInfo,
  toPx,
} from './misc';
import parsers from './parsers';
import { padNode, padText } from './pad';
import updateSize from './size';

export default updateNode => ({
  image: (node, values) => {
    const result = node || createNode('img');
    update.props(
      result,
      getValues(
        values,
        { image: 'string', width: 'number' },
        ({ image, width }) => ({
          src: image,
          style: { maxWidth: toPx(width) },
        }),
      ),
      getSetters(values, boxSetters),
    );
    return result;
  },
  input: (node, values) => {
    const result = node || createNode('input');
    update.props(
      result,
      getValues(values, { input: 'string' }, ({ input }) => ({
        type: 'text',
        value: input,
      })),
      getSetters(values, {
        input: set => ({
          oninput: set && (e => set(toData(e.target.value))),
        }),
        focus: set => ({
          onfocus: set && (() => set(toData(true))),
          onblur: set && (() => set(toData(false))),
        }),
        ...boxSetters,
      }),
    );
    return result;
  },
  text: (node, values, indices, context) => {
    const result = node || createNode('span');
    const text = textInfo(getValues(values, textConfig), context);
    update.children(result, indices, updateNode('text', text.info));
    update.props(result, text.props, getSetters(values, {}));
    return result;
  },
  box: (node, values, indices, context) => {
    const vals = getValues(values, { ...textConfig, ...boxConfig });
    const text = textInfo(vals, context);
    const depths = { inner: 2, child: 2 };
    const inner = (node && findChild(node, depths.inner)) || createNode('div');
    update.children(inner, indices, updateNode('box', text.info), depths.child);
    update.props(inner, text.props, getSetters(values, {}));
    getChildren(inner).forEach(n => {
      const c = findChild(n, depths.child);
      c.parentNode.style.display =
        c.nodeType === 3 || c.tagName === 'SPAN' ? 'inline' : 'block';
      c.parentNode.parentNode.style.display =
        c.nodeType === 3 || c.tagName === 'SPAN' ? 'inline' : 'block';
    });
    const result = node || createNode(inner, depths.inner);
    padText(inner, text.pad);
    const box = boxInfo(vals);
    const size = updateSize(result, values, context, false);
    update.props(
      result,
      mergeObjs(box.props, size.props),
      getSetters(values, boxSetters),
    );
    const [top, right, bottom, left] = box.pad || ([] as any);
    padNode(inner, 'pad', { top, right, bottom, left });
    return result;
  },
  cols: (node, values, indices, context) => {
    if (node) {
      [...node.childNodes].forEach(n => {
        if (n.__gap) node.removeChild(n);
        else [...n.childNodes].forEach(c => c.__gap && n.removeChild(c));
      });
    }
    const result = node || createNode('div');
    const vals = getValues(values, {
      gap: 'string',
      cols: 'string',
      ...textConfig,
      ...boxConfig,
    });
    const gap = parsers.dirs(vals.gap);
    const { cols, equal } = parsers.cols(vals.cols, indices.length);
    const text = textInfo(vals, context);
    update.children(
      result,
      indices.map(d => {
        const v = parseValue(
          { '': 'string', gap: 'string', cols: 'string' },
          d,
        );
        if (d.type === 'list' && !v[''] && !v.gap && !v.cols) return d;
        return { type: 'list', value: { indices: [d], values: {} } };
      }),
      updateNode('box', { ...text.info, width: equal && `${100 / cols}%` }),
      0,
      cols,
    );
    const box = boxInfo(vals);
    const size = updateSize(result, values, context, true);
    update.props(
      result,
      mergeObjs(
        {
          style: {
            display: 'table',
            tableLayout: 'fixed',
            padding: toPx(box.pad),
          },
        },
        text.props,
        box.props,
        size.props,
      ),
      getSetters(values, boxSetters),
    );
    getChildren(result).forEach((row, i) => {
      if (gap && i !== 0) {
        result.insertBefore(
          applyObj(createNode('div'), {
            __gap: true,
            style: { display: 'table-row', height: toPx(gap[0]) },
          }),
          row,
        );
      }
      row.style.display = 'table-row';
      getChildren(row).forEach((cell, i) => {
        if (gap && i !== 0) {
          row.insertBefore(
            applyObj(createNode('div'), {
              __gap: true,
              style: { display: 'table-cell', width: toPx(gap[1]) },
            }),
            cell,
          );
        }
        cell.style.display = 'table-cell';
        cell.style.verticalAlign = size.vAlign;
      });
    });
    return result;
  },
});
