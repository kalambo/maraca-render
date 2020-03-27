import { fromJs } from 'maraca';
import { ResizeObserver } from '@juggle/resize-observer';
import * as throttle from 'lodash.throttle';

const toJs = (data) => {
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
      if (['svg', 'path'].includes(target.tagName?.toLowerCase())) {
        target.setAttribute(k, obj[k] === undefined ? null : obj[k]);
      } else {
        target[k] = obj[k] === undefined ? null : obj[k];
      }
    } else {
      applyObj(target[k], obj[k]);
    }
  });
  return target;
};

const createNode = (type) =>
  type === 'text'
    ? document.createTextNode('')
    : ['svg', 'path'].includes(type)
    ? document.createElementNS('http://www.w3.org/2000/svg', type)
    : document.createElement(type);

const getNodeInfo = (data) => {
  if (data.type === 'value') return { type: 'text', props: data.value };
  const {
    values: { ['']: type, ...props },
    indices,
  } = unpack(data.value);
  const typeValue = type?.type === 'value' ? type.value : 'div';
  return {
    type: typeValue.startsWith(' ') ? typeValue.slice(1) || 'div' : typeValue,
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

const eventProperties = {
  mouse: [
    'altKey',
    'button',
    'buttons',
    'clientX',
    'clientY',
    'ctrlKey',
    'metaKey',
    'movementX',
    'movementY',
    'region',
    'screenX',
    'screenY',
    'shiftKey',
  ],
  keyboard: [
    'altKey',
    'code',
    'ctrlKey',
    'isComposing',
    'key',
    'locale',
    'location',
    'metaKey',
    'repeat',
    'shiftKey',
  ],
};

const pick = (obj, keys) =>
  keys.reduce((res, k) => ({ ...res, [k]: obj[k] }), {});

const disposeNode = (root, node) => {
  [...node.childNodes].forEach((c) => disposeNode(root, c));
  root.remove(node);
  if (node.__observer) {
    node.__observer.disconnect();
    node.__resize = null;
    node.__observer = null;
  }
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
    const { hover, click, enter, focus, rect, ...otherProps } = info.props;
    const props = {
      ...Object.keys(otherProps).reduce(
        (res, k) => ({ ...res, [k]: toJs(info.props[k]) }),
        {},
      ),
      onmouseenter:
        hover?.push &&
        ((e) => hover?.push(fromJs(pick(e, eventProperties.mouse)))),
      onmouseleave: hover?.push && (() => hover?.push(fromJs(false))),
      onmousedown:
        click?.push &&
        ((e) => {
          if (e.button === 0) {
            click?.push(fromJs(pick(e, eventProperties.mouse)));
          }
        }),
      onkeypress:
        enter?.push &&
        ((e) => {
          if (e.keyCode === 13)
            enter?.push(fromJs(pick(e, eventProperties.keyboard)));
        }),
      onfocus: focus?.push && (() => focus?.push(fromJs(true))),
      onblur: focus?.push && (() => focus?.push(fromJs(false))),
      oninput:
        otherProps.value?.push &&
        ((e) => otherProps.value?.push(fromJs(e.target.value))),
    } as any;

    if (focus?.value) setTimeout(() => node.focus());

    const diff = diffObjs(props, node.__props || {});
    applyObj(node, diff);
    node.__props = props;

    if (rect?.push) {
      node.__resizePush = rect.push;
      if (!node.__observer) {
        node.__resize = throttle(() => {
          const { top, left, height, width } = node.getBoundingClientRect();
          node.__resizePush(fromJs({ top, left, height, width }));
        }, 100);
        node.__observer = new ResizeObserver(node.__resize);
        node.__observer.observe(node);
        window.addEventListener('resize', node.__resize);
      }
    } else if (node.__resize) {
      node.__observer.disconnect();
      window.removeEventListener('resize', node.__resize);
      node.__resizePush = null;
      node.__resize = null;
      node.__observer = null;
    }

    updateChildren(root, node, info.indices);
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
