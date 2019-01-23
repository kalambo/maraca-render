import { toData } from 'maraca';

import {
  applyObj,
  createNode,
  findChild,
  getChildren,
  getSetters,
  getValues,
  mergeObjs,
  printValue,
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

export default {
  print: (node, values, _, context) => {
    const inner = (node && findChild(node, 2)) || createNode('span');
    const vals = getValues(values, { ...textConfig, ...boxConfig });
    const text = textInfo(vals, context);
    const box = boxInfo(vals);
    const size = updateSize(inner, values, {}, false);
    update.props(
      inner,
      mergeObjs({ style: { whiteSpace: 'pre-wrap' } }, text.props, size.props),
    );
    inner.textContent = printValue(
      getValues(values, { print: true }).print,
      Math.ceil(inner.offsetWidth / (text.info.size * 0.8)),
    );
    const result = node || createNode(inner, 2);
    update.props(result, box.props);
    padText(inner.parentNode, text.pad);
    const [top, right, bottom, left] = box.pad || ([] as any);
    padNode(inner.parentNode, 'pad', { top, right, bottom, left });
    return result;
  },
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
          oninput: set && (e => set(toData(e.target.value))),
        }),
        focus: set => ({
          onfocus: set && (() => set(toData(true))),
          onblur: set && (() => set(toData(false))),
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
    const text = textInfo(getValues(values, textConfig), context);
    update.children(result, indices, next('text', text.info));
    update.props(result, text.props);
    return result;
  },
  box: (node, values, indices, context, next) => {
    const vals = getValues(values, { ...textConfig, ...boxConfig });
    const text = textInfo(vals, context);
    const depths = { inner: 2, child: 2 };
    const inner = (node && findChild(node, depths.inner)) || createNode('div');
    update.children(inner, indices, next('box', text.info), depths.child);
    update.props(inner, text.props);
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
      getSetters(values, boxSetters.config, boxSetters.setters),
    );
    const [top, right, bottom, left] = box.pad || ([] as any);
    padNode(inner, 'pad', { top, right, bottom, left });
    return result;
  },
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
      next('box', { ...text.info, width: equal && `${100 / cols}%` }, cols),
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
