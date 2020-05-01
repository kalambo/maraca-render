import { fromJs, toJs } from 'maraca';
import * as throttle from 'lodash.throttle';

import { applyObj, diffObjs } from './apply';
import updateChildren from './children';
import { observeSize, unobserveSize, updateSizes } from './size';

const createNode = (type) => {
  if (type === 'text') {
    return document.createTextNode('');
  }
  if (['svg', 'path'].includes(type)) {
    return document.createElementNS('http://www.w3.org/2000/svg', type);
  }
  try {
    return document.createElement(type);
  } catch {
    return document.createElement('div');
  }
};

const getNodeBox = (node) => {
  const { top, left, height, width } = node.getBoundingClientRect();
  return { top, left, height, width };
};

class EventQueue {
  queues = {};
  set(key, value) {
    this.queues[key] = this.queues[key] || [];
    const prev = this.queues[key][this.queues[key].length - 1];
    if (
      (prev === 'true' && value === 'down') ||
      (prev === '' && value === 'up')
    ) {
      this.queues[key][this.queues[key].length - 1] = value;
    } else if (prev !== value) {
      this.queues[key].push(value);
    }
  }
  update(data = {}) {
    const result = {};
    for (const k of Object.keys({ ...data, ...this.queues })) {
      result[k] = data[k] || '';
      if (this.queues[k]) {
        const queued = this.queues[k][0];
        if (
          (['down', 'true'].includes(queued) &&
            ['down', 'true'].includes(result[k])) ||
          (['up', ''].includes(queued) && ['up', ''].includes(result[k]))
        ) {
          this.queues[k].shift();
          if (this.queues[k].length === 0) delete this.queues[k];
        }
      }
      result[k] = { down: 'true', true: 'true', up: '', '': '' }[result[k]];
      if (this.queues[k]) result[k] = this.queues[k][0];
      if (!result[k]) delete result[k];
    }
    return result;
  }
  clear() {
    this.queues = {};
  }
}

const attributesMap = {
  accesskey: 'accessKey',
  bgcolor: 'bgColor',
  class: 'className',
  colspan: 'colSpan',
  contenteditable: 'contentEditable',
  crossorigin: 'crossOrigin',
  dirname: 'dirName',
  inputmode: 'inputMode',
  ismap: 'isMap',
  maxlength: 'maxLength',
  minlength: 'minLength',
  novalidate: 'noValidate',
  readonly: 'readOnly',
  referrerpolicy: 'referrerPolicy',
  rowspan: 'rowSpan',
  tabindex: 'tabIndex',
};

export const updateNode = (root, { data, type }, prev) => {
  if (prev?.__data === data) return prev;

  const node =
    type === prev?.nodeName.replace('#', '').toLowerCase()
      ? prev
      : createNode(type);
  if (type === 'text') {
    node.textContent = data.value;
  } else {
    const {
      focus,
      keys,
      stopKeys = [],
      mouse,
      stopMouse = [],
      box,
      value,
      ...other
    } = toJs(data, {
      focus: () => 'boolean',
      keys: () => ({ '*': 'string' }),
      stopKeys: ['string'],
      mouse: () => ({ left: 'string', middle: 'string', right: 'string' }),
      stopMouse: ['string'],
      box: () => null,
      value: () => 'string',
      style: { '*': 'string' },
      '*': 'string',
    });

    if (!node.__keysQueue) node.__keysQueue = new EventQueue();
    const keyFunc = (dir) =>
      (keys.push || stopKeys.length > 0) &&
      ((e) => {
        if (keys.push) {
          node.__keysQueue.set(e.key, dir);
          keys.push(fromJs(node.__keysQueue.update(keys.value)));
        }
        if (stopKeys.includes(e.key)) e.preventDefault();
      });

    if (!node.__mouseQueue) node.__mouseQueue = new EventQueue();
    const boxPushChanged = node.__setBox && node.__setBox !== box.push;
    node.__setBox = box.push;
    node.__mouse = mouse;
    if (!node.__setMouseBox) {
      node.__setMouseBoxBase = ({ box, mouse }) => {
        if (node.__setBox) node.__setBox(fromJs(box));
        if (node.__mouse.push && mouse !== undefined) {
          if (!mouse) {
            node.__mouseQueue.clear();
            node.__mouse.push(fromJs(null));
          } else {
            node.__mouse.push(
              fromJs({
                ...node.__mouseQueue.update(node.__mouse.value),
                ...mouse,
              }),
            );
          }
        }
      };
      node.__setMouseBox = throttle(node.__setMouseBoxBase, 50);
    }

    if (box.push) {
      observeSize(node, () => node.__setMouseBox({ box: getNodeBox(node) }));
    } else {
      unobserveSize(node);
    }
    if (boxPushChanged) node.__setMouseBox({ box: getNodeBox(node) });
    node.onscroll = () => updateSizes();

    const mouseFunc = (dir) =>
      (mouse.push || stopMouse.length > 0) &&
      ((e) => {
        const button = { 0: 'left', 1: 'middle', 2: 'right' }[e.button];
        if (button) {
          node.__mouseQueue.set(button, dir);
          node.__setMouseBox.cancel();
          node.__setMouseBoxBase({
            box: getNodeBox(node),
            mouse: { x: e.clientX, y: e.clientY },
          });
          if (stopMouse.includes(button)) e.preventDefault();
        }
      });
    const mouseMoveFunc = (throttle, leave) =>
      mouse.push &&
      ((e) => {
        const [left, right, middle] = e.buttons
          .toString(2)
          .split('')
          .reverse()
          .map((x) => x === '1');
        if (left) node.__mouseQueue.set('left', 'true');
        if (right) node.__mouseQueue.set('right', 'true');
        if (middle) node.__mouseQueue.set('middle', 'true');

        if (!throttle) node.__setMouseBox.cancel();
        (throttle ? node.__setMouseBox : node.__setMouseBoxBase)({
          box: getNodeBox(node),
          mouse: leave ? null : { x: e.clientX, y: e.clientY },
        });
      });

    const props = {
      ...Object.keys(other).reduce(
        (res, k) => ({ ...res, [attributesMap[k] || k]: other[k] }),
        {},
      ),
      value: value.value || '',
      onkeydown: keyFunc('down'),
      onkeyup: keyFunc('up'),
      onmousedown: mouseFunc('down'),
      onmouseup: mouseFunc('up'),
      onclick:
        stopMouse.length > 0 &&
        ((e) => {
          const button = { 0: 'left', 1: 'middle', 2: 'right' }[e.button];
          if (button && stopMouse.includes(button)) e.preventDefault();
        }),
      oncontextmenu:
        stopMouse.length > 0 &&
        ((e) => {
          if (stopMouse.includes('Right')) e.preventDefault();
        }),
      onmouseenter: mouseMoveFunc(false, false),
      onmousemove: mouseMoveFunc(true, false),
      onmouseleave: mouseMoveFunc(false, true),
      onfocus:
        focus?.push &&
        (() => {
          focus.push(fromJs(true));
        }),
      onblur:
        focus?.push &&
        (() => {
          node.__keysQueue.clear();
          focus.push(fromJs(false));
        }),
      oninput: value.push && ((e) => value.push(fromJs(e.target.value))),
    } as any;

    if (focus.value) setTimeout(() => node.focus());

    if (props.innerHTML && !(node.__props || {}).innerHTML) {
      updateChildren(root, node, []);
    }

    applyObj(node, diffObjs(props, node.__props || {}));

    if (!props.innerHTML) {
      updateChildren(
        root,
        node,
        data.value.toBoth().indices.filter((x) => x),
      );
    }

    node.__props = props;
  }
  node.__data = data;
  return node;
};

export const disposeNode = (root, node) => {
  [...node.childNodes].forEach((c) => disposeNode(root, c));
  unobserveSize(node);
  if (node.__setMouseBox) node.__setMouseBox.cancel();
  root.remove(node);
};
