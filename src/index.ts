import * as erd from 'element-resize-detector';
import * as throttle from 'lodash.throttle';
import { toData } from 'maraca';

import updateChart from './chart';
import updateCode from './code';
import updateMap from './map';
import { padText, setPad } from './pad';
import parse from './parse';
import { createElem, dom, findElem, getChildren, extract, toPx } from './utils';

const resizeDetector = erd({ strategy: 'scroll' });

const updateChild = (values, child, width, first, last) => {
  if (['row', 'tablerow'].includes(values.type)) {
    child.style.display = 'table-cell';
    child.style.verticalAlign = values.align || 'top';
    setPad('cell', child, { top: values.gap, left: values.gap });
    child.style.width =
      typeof width === 'number'
        ? toPx((width || 0) + (values.gap || 0))
        : width || '';
  } else if (values.gap) {
    setPad('stack', child, { top: !first && values.gap });
  }
  if (values.type === 'tablerow') {
    child.style.overflow = 'hidden';
    child.style.background = values.fill;
    child.style.borderRadius = toPx([
      (first && (values.round || [])[0]) || '0',
      (last && (values.round || [])[1]) || '0',
      (last && (values.round || [])[2]) || '0',
      (first && (values.round || [])[3]) || '0',
    ]);
    const [top, right, bottom, left] = values.pad || ([] as any);
    setPad('pad', child, { top, right, bottom, left });
  }
};

const updateChildren = (depth, inner, indices, values) => {
  const children = getChildren(inner);
  indices.forEach((d, index) => {
    const i = children.findIndex(c => c.__id === (d.id || index + 1));
    let child = i !== -1 && children.splice(i, 1)[0];
    const childNode = child && findElem(child, depth);
    const newNode = update(childNode, d, values);
    if (!newNode) {
      if (childNode && childNode.__destroy) childNode.__destroy();
      inner.removeChild(child);
    } else {
      if (newNode !== childNode) {
        if (!child) {
          child = createElem(depth, newNode);
          inner.appendChild(child);
        } else {
          if (childNode && childNode.__destroy) childNode.__destroy();
          childNode.parentNode.replaceChild(newNode, childNode);
          if (newNode.parentNode === inner) child = newNode;
        }
      }
      if (child !== inner.childNodes[index]) {
        inner.insertBefore(child, inner.childNodes[index]);
      }
    }
    updateChild(
      values,
      child,
      newNode.__width && newNode.__width[1].width,
      index === 0,
      index === indices.length - 1,
    );
    // Array.from({ length: depth }).reduce(res => {
    //   const next = res && getChildren(res)[0];
    //   if (next && next.tagName === 'DIV') {
    //     // next.style.height = values.height ? '100%' : '';
    //     next.style.height = '100%';
    //   }
    //   return next;
    // }, child);
    child.__id = d.id || index + 1;
  });
  children.forEach(child => {
    const childNode = findElem(child, depth);
    if (childNode.__destroy) childNode.__destroy();
    inner.removeChild(child);
  });
};

const updateInner = (inner, values, setters) => {
  if (values.type === 'image') {
    inner.src = values.image;
  } else {
    inner.style.fontSize = toPx(values.fontSize);
    inner.style.minHeight = toPx(values.fontSize);
    inner.style.lineHeight = toPx(
      Math.floor(values.lineHeight * values.fontSize),
    );
    [
      'fontWeight',
      'fontStyle',
      'textAlign',
      'fontFamily',
      'color',
      'whiteSpace',
      'display',
      'listStylePosition',
    ].forEach(k => (inner.style[k] = values[k] || ''));
  }
  if (values.type === 'input') {
    inner.type = values.password ? 'password' : 'text';
    inner.value = values.input || '';
    inner.oninput =
      setters.input && (e => setters.input(toData(e.target.value)));
    inner.onfocus = setters.focus && (() => setters.focus(toData(true)));
    inner.onblur = setters.focus && (() => setters.focus(toData(false)));
    if (values.focus) inner.focus();
  }
  if (['row', 'table'].includes(values.type)) {
    inner.style.display = 'table';
    inner.style.tableLayout = values.fixed ? 'fixed' : 'auto';
    inner.style.width = values.side ? 'auto' : '100%';
  }
  if (values.type === 'tablerow') {
    inner.style.display = 'table-row';
  }
};

const updateOuter = (outer, values, setters, parent) => {
  outer.style.position = 'relative';
  outer.onmouseenter = setters.hover && (() => setters.hover(toData(true)));
  outer.onmouseleave = setters.hover && (() => setters.hover(toData(false)));
  outer.onmousedown =
    setters.click && (() => setters.click(values.value || toData(null)));
  outer.style.overflow = setters.click ? 'hidden' : '';
  outer.style.cursor = setters.click ? 'pointer' : '';
  outer.style.userSelect = setters.click ? 'none' : '';
  outer.style.WebkitUserSelect = setters.click ? 'none' : '';
  outer.style.MozUserSelect = setters.click ? 'none' : '';
  outer.style.msUserSelect = setters.click ? 'none' : '';
  outer.onkeypress =
    setters.enter &&
    (e => {
      if (e.keyCode === 13) setters.enter(values.value || toData(null));
    });
  if (!['image', 'tablerow'].includes(values.type)) {
    outer.style.background = values.fill;
    outer.style.borderRadius = toPx(values.round);
  }
  if (['row', 'table'].includes(values.type)) {
    setPad('table', outer, { top: -values.gap, left: -values.gap });
  }
  if (['box', 'row', 'table', 'stack', 'image'].includes(values.type)) {
    if (!setters.size) {
      resizeDetector.removeAllListeners(outer);
      if (setters.height || setters.width) {
        resizeDetector.listenTo(
          outer,
          throttle(() => {
            if (setters.height) setters.height(toData(outer.offsetHeight));
            if (setters.width) setters.width(toData(outer.offsetWidth));
          }, 50),
        );
      }
    }
    // outer.style.overflow = values.height ? 'scroll' : '';
    if (!['row', 'tablerow'].includes(parent.type)) {
      outer.style.maxWidth =
        typeof values.width === 'number'
          ? toPx(values.width)
          : values.width || '';
      outer.style.display = !values.width && values.side ? 'inline-block' : '';
      outer.style.verticalAlign = !values.width && values.side ? 'top' : '';
      outer.parentNode.style.textAlign = values.width ? '' : values.side;
      outer.style.textAlign = 'left';
      setPad('width', outer.parentNode, {
        left: values.width && values.side !== 'left' ? 'auto' : 0,
        right: values.width && values.side !== 'right' ? 'auto' : 0,
      });
    }
  }
  if (['box', 'input', 'bar', 'row', 'table', 'stack'].includes(values.type)) {
    const [top, right, bottom, left] = values.pad || ([] as any);
    setPad('pad', outer, { top, right, bottom, left });
  }
};

const update = (node, data, parent) => {
  if (data.type === 'nil') return null;

  if (data.type === 'value') {
    if (!node || node.nodeType !== 3) return dom('text', data.value);
    node.nodeValue = data.value;
    return node;
  }

  const { values: baseValues, setters } = extract(data.value.values, [
    'value',
    'format',
  ]);
  const values = parse(baseValues, setters, parent);
  const prev = node && node.__type === values.type && node;

  const setheight = setters.height;
  const setwidth = setters.width;
  if (setheight && (prev && prev.__height && prev.__height[0] === setheight)) {
    Object.assign(values, prev.__height[1]);
  }
  if (setwidth && (prev && prev.__width && prev.__width[0] === setwidth)) {
    Object.assign(values, prev.__width[1]);
  }
  if (
    prev &&
    prev.__height &&
    prev.__height[0] === setheight &&
    (prev && prev.__width && prev.__width[0] === setwidth)
  ) {
    setters.size = true;
  }

  const outerDepth = {
    inline: 0,
    image: 0,
    input: 2,
    tablerow: 0,
    row: 2,
    table: 2,
    stack: 1,
    box: 1,
    map: 0,
    chart: 0,
  }[values.type];
  const innerType =
    {
      image: 'img',
      input: 'input',
      inline: 'span',
      chart: 'canvas',
    }[values.type] || 'div';
  const doWrap =
    !['inline', 'tablerow'].includes(values.type) &&
    !['row'].includes(parent.type);
  const outer = prev
    ? findElem(prev, doWrap ? 1 : 0)
    : createElem(outerDepth, innerType);
  const wrap = prev || (doWrap ? createElem(1, outer) : outer);
  const inner = findElem(outer, outerDepth);
  const childDepth = ['row', 'stack', 'tablerow'].includes(values.type) ? 2 : 0;

  // // wrap.style.height = values.height ? '100%' : '';
  // outer.style.height = '100%';
  // wrap.style.height = values.height || '';
  // Array.from({ length: outerDepth }).reduce(res => {
  //   const next = res && getChildren(res)[0];
  //   if (next && next.tagName === 'DIV') {
  //     // next.style.height = values.height ? '100%' : '';
  //     next.style.height = '100%';
  //   }
  //   return next;
  // }, outer);

  if (values.type === 'map') {
    const destroy = updateMap(inner, values, data.value.indices);
    wrap.__destroy = destroy;
  } else if (values.type === 'chart') {
    const destroy = updateChart(inner, values, data.value.indices);
    wrap.__destroy = destroy;
  } else if (values.type === 'code') {
    const destroy = updateCode(inner, values, setters);
    wrap.__destroy = destroy;
  } else {
    updateChildren(childDepth, inner, data.value.indices, values);
    updateInner(inner, values, setters);
    updateOuter(outer, values, setters, parent);
  }

  if (childDepth) {
    getChildren(inner).forEach(c =>
      padText(findElem(c, childDepth - 1), values),
    );
  } else {
    if (values.type === 'input') padText(inner.parentNode, values);
    else padText(inner, values);
  }

  wrap.__type = values.type;
  wrap.__height = [setheight, { height: values.height }];
  wrap.__width = [setwidth, { width: values.width, side: values.side }];
  return wrap;
};

export default (node, data) => {
  const child = node.childNodes[0] || null;
  const updated = update(
    child,
    data.type === 'nil'
      ? data
      : {
          type: 'list',
          value: {
            indices: [data],
            values: {
              // height: {
              //   key: { type: 'value', value: 'height' },
              //   value: { type: 'value', value: '1' },
              // },
            },
          },
        },
    { type: 'box', fontSize: 20, lineHeight: 1.5, textAlign: 'left' },
  );
  if (updated !== child) {
    if (updated && child) node.replaceChild(updated, child);
    else if (updated) node.appendChild(updated);
    else if (child) node.removeChild(child);
  }
  return node;
};
