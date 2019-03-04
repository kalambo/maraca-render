import { fromJs } from 'maraca';

import {
  applyObj,
  createNode,
  findChild,
  getChildren,
  getSetters,
  getValues,
  mergeObjs,
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

export const updateBox = (node, values, context, content, innerProps = {}) => {
  const vals = getValues(values, { ...textConfig, ...boxConfig });
  const text = textInfo(vals, context);
  const inner = (node && findChild(node, 2)) || createNode('div');
  content(inner, text.info);
  update.props(inner, mergeObjs(text.props, innerProps));
  const outer = node || createNode(inner, 2);
  padText(inner, text.pad);
  const box = boxInfo(vals);
  const size = updateSize(outer, values, context, false);
  update.props(
    outer,
    mergeObjs(box.props, size.props),
    getSetters(values, boxSetters.config, boxSetters.setters),
  );
  const [top, right, bottom, left] = box.pad || ([] as any);
  padNode(inner, 'pad', { top, right, bottom, left });
  return outer;
};

export default {
  image: (node, values) => {
    const result = node || createNode('img');
    const size = updateSize(result, values, {}, false);
    update.props(
      result,
      mergeObjs(
        size.props,
        getValues(values, { image: 'string' }, ({ image }) => ({ src: image })),
      ),
      getSetters(values, boxSetters.config, boxSetters.setters),
    );
    return result;
  },
  input: (node, values, _, context) => {
    const inner = (node && findChild(node, 2)) || createNode('input');
    const vals = getValues(values, { ...textConfig, ...boxConfig });
    const text = textInfo(vals, context, true);
    const box = boxInfo(vals);
    update.props(
      inner,
      mergeObjs(
        { type: 'text' },
        getValues(values, { input: 'string' }, ({ input }) => ({
          value: input,
        })),
        text.props,
      ),
      getSetters(values, boxSetters.config, {
        input: set => ({
          oninput: set && (e => set(fromJs(e.target.value))),
        }),
        focus: set => ({
          onfocus: set && (() => set(fromJs(true))),
          onblur: set && (() => set(fromJs(false))),
        }),
      }),
    );
    const result = node || createNode(inner, 2);
    update.props(
      result,
      box.props,
      getSetters(values, boxSetters.config, boxSetters.setters),
    );
    padText(inner.parentNode, text.pad);
    const [top, right, bottom, left] = box.pad || ([] as any);
    padNode(inner.parentNode, 'pad', { top, right, bottom, left });
    return result;
  },
  text: (node, values, indices, context, next) => {
    const result = node || createNode('span');
    const vals = getValues(values, { ...textConfig, ...boxConfig });
    const text = textInfo(vals, context);
    const box = boxInfo(vals);
    update.children(result, indices, next('text', text.info));
    update.props(
      result,
      mergeObjs(box.props, text.props),
      getSetters(values, boxSetters.config, boxSetters.setters),
    );
    return result;
  },
  box: (node, values, indices, context, next) =>
    updateBox(node, values, context, (inner, text) => {
      update.children(inner, indices, next('box', text), 2);
      getChildren(inner).forEach(n => {
        const c = findChild(n, 2);
        c.parentNode.style.display =
          c.nodeType === 3 || c.tagName === 'SPAN' ? 'inline' : 'block';
        c.parentNode.parentNode.style.display =
          c.nodeType === 3 || c.tagName === 'SPAN' ? 'inline' : 'block';
      });
    }),
  cols: (node, values, indices, context, next) => {
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
    const { cols = 1, equal } = parsers.cols(vals.cols, indices.length);
    const text = textInfo(vals, context);
    update.children(
      result,
      indices,
      next(
        'box',
        { ...text.info, width: equal && `${100 / cols}%`, colsParent: true },
        cols,
      ),
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
      getSetters(values, boxSetters.config, boxSetters.setters),
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
};
