import { toData } from 'maraca';

import { updateSimple, updateChildren, updateProps } from './core';
import parsers from './parsers';
import { padNode, padText } from './position/pad';
import updateSize from './position/size';
import {
  applyObj,
  createNode,
  findChild,
  getChildren,
  parseValue,
  parseValues,
  getSetters,
  mergeObjs,
} from './utils';

const toPx = s => {
  if (!s) return null;
  if (!Array.isArray(s)) return `${s}px`;
  return s.map(toPx).join(' ');
};

const textConfig = { style: 'string', color: 'string' };
const textInfo = (values, parent) => {
  const { fontSize, lineHeight, ...styleValues } = parsers.style(values.style);
  const size = fontSize || parent.size || 20;
  const height = lineHeight || parent.height || 1.5;
  return {
    pad: Math.floor(size * (height - 1)) * -0.5,
    info: { size, height },
    props: {
      style: {
        fontSize: toPx(size),
        minHeight: toPx(size),
        lineHeight: toPx(Math.floor(height * size)),
        ...styleValues,
        color: parsers.color(values.color),
      },
    },
  };
};

const boxConfig = {
  fill: 'string',
  pad: 'string',
  round: 'string',
};
const boxInfo = values => ({
  pad: parsers.dirs(values.pad),
  props: {
    style: {
      background: parsers.color(values.fill),
      borderRadius: toPx(parsers.dirs(values.round)),
    },
  },
});
const boxSetters = {
  hover: set => ({
    onmouseenter: set && (() => set(toData(true))),
    onmouseleave: set && (() => set(toData(false))),
  }),
  click: (set, { value }) => ({
    onmousedown: set && (() => set(value || toData(null))),
  }),
  enter: (set, { value }) => ({
    onkeypress:
      set &&
      (e => {
        if (e.keyCode === 13) set(value || toData(null));
      }),
  }),
};

const boxModes = {
  image: modes =>
    updateSimple(
      modes,
      false,
      'img',
      [
        { image: 'string', width: 'number' },
        ({ image, width }) => ({
          src: image,
          style: { maxWidth: toPx(width) },
        }),
      ],
      boxSetters,
    ),
  input: modes =>
    updateSimple(
      modes,
      false,
      'input',
      [{ input: 'string' }, ({ input }) => ({ type: 'text', value: input })],
      {
        input: set => ({ oninput: set && (e => set(toData(e.target.value))) }),
        focus: set => ({
          onfocus: set && (() => set(toData(true))),
          onblur: set && (() => set(toData(false))),
        }),
        ...boxSetters,
      },
    ),
  box: modes => (data, node, parent) => {
    const values = parseValues({ ...textConfig, ...boxConfig }, data.values);
    const text = textInfo(values, parent);
    const depths = { inner: 1, child: 2 };
    const inner = (node && findChild(node, depths.inner)) || createNode('div');
    updateChildren(modes, 'box', inner, data.indices, text.info, depths.child);
    updateProps(inner, text.props, getSetters({}, data.values));
    getChildren(inner).forEach(n => {
      const c = findChild(n, depths.child);
      c.parentNode.style.display =
        c.nodeType === 3 || c.tagName === 'SPAN' ? 'inline' : 'block';
      c.parentNode.parentNode.style.display =
        c.nodeType === 3 || c.tagName === 'SPAN' ? 'inline' : 'block';
    });
    const result = node || createNode(inner, depths.inner);
    padText(inner, text.pad);
    const box = boxInfo(values);
    const size = updateSize(result, data.values, parent, false);
    updateProps(
      result,
      mergeObjs(box.props, size.props),
      getSetters(boxSetters, data.values),
    );
    const [top, right, bottom, left] = box.pad || ([] as any);
    padNode(inner, 'pad', { top, right, bottom, left });
    return result;
  },
  cols: (modes, { gap, cols, equal }) => (data, node, parent) => {
    if (node) {
      [...node.childNodes].forEach(n => {
        if (n.__gap) node.removeChild(n);
        else [...n.childNodes].forEach(c => c.__gap && n.removeChild(c));
      });
    }
    const result = node || createNode('div');
    const values = parseValues({ ...textConfig, ...boxConfig }, data.values);
    const text = textInfo(values, parent);
    updateChildren(
      modes,
      'box',
      result,
      data.indices.map(d => {
        const v = parseValue({ '': 'string', cols: 'string' }, d);
        if (d.type === 'list' && !v[''] && !v.cols) return d;
        return { type: 'list', value: { indices: [d], values: {} } };
      }),
      { ...text.info, width: equal && `${100 / cols}%` },
      0,
      cols,
    );
    const box = boxInfo(values);
    const size = updateSize(result, data.values, parent, true);
    updateProps(
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
      getSetters(boxSetters, data.values),
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

export default modes =>
  Object.assign(modes, {
    text: updateSimple(
      modes,
      'text',
      'span',
      [textConfig, (v, p) => textInfo(v, p).props],
      {},
    ),
    box: (data, node, parent) => {
      const values = parseValues(
        { image: 'string', input: true, gap: 'string', cols: 'string' },
        data.values,
      );
      let type = 'box';
      let info = {} as any;
      if (values.image) {
        type = 'image';
      } else if (values.input && values.input.set) {
        type = 'input';
      } else {
        const { cols, equal } = parsers.cols(values.cols, data.indices.length);
        if (values.gap || cols) {
          type = 'cols';
          info = { gap: parsers.dirs(values.gap), cols: cols || 1, equal };
        }
      }
      const result = boxModes[type](modes, info)(
        data,
        node && node.__type === type && node,
        parent,
      );
      result.__type = type;
      return result;
    },
  });

//       'whiteSpace',
//       'listStylePosition',
//  inner.type = values.password ? 'password' : 'text';
//     if (values.focus) inner.focus();

//   outer.style.position = 'relative';
//   outer.style.overflow = setters.click ? 'hidden' : '';
//   outer.style.cursor = setters.click ? 'pointer' : '';
//   outer.style.userSelect = setters.click ? 'none' : '';
//   outer.style.WebkitUserSelect = setters.click ? 'none' : '';
//   outer.style.MozUserSelect = setters.click ? 'none' : '';
//   outer.style.msUserSelect = setters.click ? 'none' : '';
