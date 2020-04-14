import { fromJs } from 'maraca';
import { ResizeObserver } from '@juggle/resize-observer';
import * as throttle from 'lodash.throttle';

const onSizeChanges = [] as any[];
const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) (entry.target as any).__resize();
});
window.addEventListener('resize', () => {
  for (const onChange of onSizeChanges) onChange();
});
const observeSize = (node, onChange) => {
  if (!node.__resize) {
    onSizeChanges.push(onChange);
    node.__resize = onChange;
    resizeObserver.observe(node);
  }
};
const unobserveSize = (node) => {
  if (node.__resize) {
    onSizeChanges.splice(onSizeChanges.indexOf(node.__resize), 1);
    delete node.__resize;
    resizeObserver.unobserve(node);
  }
};

const toJs = (data) => {
  if (!data) return null;
  if (data.type === 'value') return data.value;
  return data.value
    .toPairs()
    .reduce(
      (res, { key, value }) => ({ ...res, [toJs(key)]: toJs(value) }),
      {},
    );
};

const toIndex = (v: string) => {
  const n = parseFloat(v);
  return !isNaN(v as any) && !isNaN(n) && n === Math.floor(n) && n > 0 && n;
};
const unpack = (value) => {
  const result = { values: {} as any, indices: [] as any[] };
  value.toPairs().forEach(({ key, value }) => {
    if (key.type !== 'block') {
      const i = toIndex(key.value || '');
      if (i) result.indices[i - 1] = value;
      else result.values[key.value || ''] = value;
    }
  });
  return result;
};

const kebabToCamel = (s) =>
  s
    .split('-')
    .map((x, i) => (i === 0 ? x : `${x[0].toUpperCase()}${x.slice(1)}`))
    .join('');

const isObject = (x) => Object.prototype.toString.call(x) === '[object Object]';
const diffObjs = (next, prev) => {
  const result = {};
  Array.from(
    new Set([...Object.keys(next), ...Object.keys(prev || {})]),
  ).forEach((k) => {
    if (next[k] !== (prev || {})[k]) {
      result[k] = isObject(next[k])
        ? diffObjs(next[k], (prev || {})[k])
        : next[k];
    }
  });
  return result;
};
const applyObj = (target, obj) => {
  Object.keys(obj).forEach((k) => {
    if (!isObject(obj[k])) {
      try {
        if (['svg', 'path'].includes(target.tagName?.toLowerCase())) {
          target.setAttribute(k, obj[k] === undefined ? null : obj[k]);
        } else if (
          Object.prototype.toString.call(target) ===
          '[object CSSStyleDeclaration]'
        ) {
          target[kebabToCamel(k)] = obj[k] === undefined ? null : obj[k];
        } else {
          target[k] = obj[k] === undefined ? null : obj[k];
        }
      } catch {}
    } else {
      applyObj(target[k], obj[k]);
    }
  });
  return target;
};

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

const getNodeInfo = (data) => {
  if (data.type === 'value') return { type: 'text', props: data.value };
  const {
    values: { ['']: type, ...props },
    indices,
  } = unpack(data.value);
  const typeValue = type?.type === 'value' ? type.value : 'div';
  return {
    type: typeValue.startsWith(' ') ? typeValue.slice(1) : typeValue,
    root: typeValue.startsWith(' '),
    props,
    indices,
  };
};

class Root {
  root;
  map = new Map();
  constructor(root) {
    this.root = root;
  }
  get(node, base = false) {
    if (!this.map.has(node)) {
      const rootNode = document.createElement('div');
      rootNode.style.zIndex = '0';
      if (base) {
        rootNode.style.position = 'relative';
        rootNode.style.height = '100%';
      } else {
        rootNode.style.position = 'fixed';
        rootNode.style.top = '0px';
        rootNode.style.left = '0px';
      }
      this.root.appendChild(rootNode);
      this.map.set(node, rootNode);
    }
    return this.map.get(node);
  }
  remove(node) {
    if (this.map.has(node)) {
      this.root.removeChild(this.map.get(node));
      this.map.delete(node);
    }
  }
}

const disposeNode = (root, node) => {
  [...node.childNodes].forEach((c) => disposeNode(root, c));
  unobserveSize(node);
  if (node.__setMouseBox) node.__setMouseBox.cancel();
  root.remove(node);
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
  update(data, filterKeys) {
    const v = toJs(data);
    const obj = isObject(v) ? v : {};
    const result = {};
    for (const k of Object.keys({ ...obj, ...this.queues }).filter(
      (k) => !filterKeys || filterKeys.includes(k),
    )) {
      result[k] = obj[k] || '';
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

const getNode = (root, { data, info }, prev) => {
  if (prev?.__data === data) return prev;

  const node =
    info.type === prev?.nodeName.replace('#', '').toLowerCase()
      ? prev
      : createNode(info.type);
  if (info.type === 'text') {
    node.textContent = info.props;
  } else {
    const {
      focus,
      keys,
      stopKeys,
      mouse,
      stopMouse,
      box,
      ...other
    } = info.props;

    const [stopKeysValues, stopMouseValues] = [stopKeys, stopMouse].map((d) => {
      const v = toJs(d);
      return Object.keys(isObject(v) ? v : {})
        .map((k) => v[k])
        .filter((x) => typeof x === 'string');
    });

    if (!node.__keysQueue) node.__keysQueue = new EventQueue();
    const keyFunc = (dir) =>
      (keys?.push || stopKeysValues.length > 0) &&
      ((e) => {
        if (keys?.push) {
          node.__keysQueue.set(e.key, dir);
          keys.push(fromJs(node.__keysQueue.update(keys)));
        }
        if (stopKeysValues.includes(e.key)) e.preventDefault();
      });

    if (!node.__mouseQueue) node.__mouseQueue = new EventQueue();
    const boxPushChanged = node.__setBox && node.__setBox !== box?.push;
    node.__setBox = box?.push;
    node.__mouse = mouse;
    if (!node.__setMouseBox) {
      node.__setMouseBoxBase = ({ box, mouse }) => {
        if (node.__setBox) node.__setBox(fromJs(box));
        if (node.__mouse?.push && mouse !== undefined) {
          if (!mouse) {
            node.__mouseQueue.clear();
            node.__mouse?.push(fromJs(null));
          } else {
            node.__mouse?.push(
              fromJs({
                ...node.__mouseQueue.update(node.__mouse, [
                  'left',
                  'middle',
                  'right',
                ]),
                ...mouse,
              }),
            );
          }
        }
      };
      node.__setMouseBox = throttle(node.__setMouseBoxBase, 50);
    }

    if (box?.push) {
      observeSize(node, () => node.__setMouseBox({ box: getNodeBox(node) }));
    } else {
      unobserveSize(node);
    }
    if (boxPushChanged) node.__setMouseBox({ box: getNodeBox(node) });
    node.onscroll = () => onSizeChanges.forEach((x) => x());

    const mouseFunc = (dir) =>
      (mouse?.push || stopMouseValues.length > 0) &&
      ((e) => {
        const button = { 0: 'left', 1: 'middle', 2: 'right' }[e.button];
        if (button) {
          node.__mouseQueue.set(button, dir);
          node.__setMouseBox.cancel();
          node.__setMouseBoxBase({
            box: getNodeBox(node),
            mouse: { x: e.clientX, y: e.clientY },
          });
          if (stopMouseValues.includes(button)) e.preventDefault();
        }
      });
    const mouseMoveFunc = (throttle, leave) =>
      mouse?.push &&
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
        (res, k) => ({ ...res, [attributesMap[k] || k]: toJs(other[k]) }),
        {},
      ),
      onkeydown: keyFunc('down'),
      onkeyup: keyFunc('up'),
      onmousedown: mouseFunc('down'),
      onmouseup: mouseFunc('up'),
      onclick:
        stopMouseValues.length > 0 &&
        ((e) => {
          const button = { 0: 'left', 1: 'middle', 2: 'right' }[e.button];
          if (button && stopMouseValues.includes(button)) e.preventDefault();
        }),
      oncontextmenu:
        stopMouseValues.length > 0 &&
        ((e) => {
          if (stopMouseValues.includes('Right')) e.preventDefault();
        }),
      onmouseenter: mouseMoveFunc(false, false),
      onmousemove: mouseMoveFunc(true, false),
      onmouseleave: mouseMoveFunc(false, true),
      onfocus:
        focus?.push &&
        (() => {
          focus?.push(fromJs(true));
        }),
      onblur:
        focus?.push &&
        (() => {
          node.__keysQueue.clear();
          focus?.push(fromJs(false));
        }),
      oninput:
        other.value?.push && ((e) => other.value?.push(fromJs(e.target.value))),
    } as any;

    if (other.focus?.value) setTimeout(() => node.focus());

    if (props.innerHTML && !(node.__props || {}).innerHTML) {
      updateChildren(root, node, []);
    }

    applyObj(node, diffObjs(props, node.__props || {}));

    if (!props.innerHTML) updateChildren(root, node, info.indices);

    node.__props = props;
  }
  node.__data = data;
  return node;
};

const updateChildrenSet = (root, node, indices) => {
  const children = [...node.childNodes];
  for (let i = 0; i < Math.max(children.length, indices.length); i++) {
    const prev = children[i];
    if (!indices[i]) {
      disposeNode(root, prev);
      node.removeChild(prev);
    } else {
      const next = getNode(root, indices[i], prev);
      if (!prev) {
        node.appendChild(next);
      } else if (next !== prev) {
        disposeNode(root, prev);
        node.replaceChild(next, prev);
      }
    }
  }
};
const updateChildren = (root, node, indices) => {
  const mappedIndices = indices.map((data) => ({
    data,
    info: getNodeInfo(data),
  }));
  updateChildrenSet(
    root,
    node,
    mappedIndices.filter((x) => !x.info.root),
  );
  const rootIndices = mappedIndices.filter((x) => x.info.root);
  if (rootIndices.length === 0) root.remove(node);
  else updateChildrenSet(root, root.get(node), rootIndices);
};

export default (node) => {
  const root = new Root(node);
  const rootNode = root.get(node, true);
  return (data) => {
    if (data) {
      updateChildren(root, rootNode, [data]);
    } else {
      while (node.lastChild) {
        disposeNode(root, node.lastChild);
        node.removeChild(node.lastChild);
      }
    }
  };
};
