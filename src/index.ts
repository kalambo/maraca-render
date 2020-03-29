import { Block, fromJs } from 'maraca';
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

const disposeNode = (root, node) => {
  [...node.childNodes].forEach((c) => disposeNode(root, c));
  if (node.__observer) {
    node.__observer.disconnect();
    node.__observer = null;
    node.__setMouseBox.flush();
    window.removeEventListener('resize', node.__setMouseBox);
  }
  root.remove(node);
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

    node.__setBox = box?.push;
    node.__setMouse = mouse?.push;
    if (!node.__setMouseBox) {
      node.__setMouseBoxBase = (mouseInfo) => {
        if (node.__setBox) {
          const { top, left, height, width } = node.getBoundingClientRect();
          node.__setBox(fromJs({ top, left, height, width }));
        }

        if (node.__mouse) {
          ['Left', 'Middle', 'Right'].forEach((b) => {
            node.__mouse[b] = node.__mouse[b] && node.__mouse[b] !== 'up';
          });
          node.__mouse = { ...node.__mouse, ...(mouseInfo || {}) };
        }
        if (node.__setMouse && node.__mouse !== undefined) {
          node.__setMouse(fromJs(node.__mouse));
          if (node.__mouse === null) delete node.__mouse;
        }
      };
      node.__setMouseBox = throttle(node.__setMouseBoxBase, 50);
    }

    if (!box?.push !== !node.__observer) {
      if (box?.push) {
        node.__observer = new ResizeObserver(node.__setMouseBox);
        node.__observer.observe(node);
        window.addEventListener('resize', node.__setMouseBox);
      } else {
        node.__observer.disconnect();
        node.__observer = null;
        node.__setMouseBox.flush();
        window.removeEventListener('resize', node.__setMouseBox);
      }
    }

    const stopKeyValues =
      stopKeys?.type === 'block'
        ? stopKeys.value
            .toPairs()
            .map((x) => x.value.type === 'value' && x.value.value)
            .filter((x) => x)
        : [];
    const stopMouseValues =
      stopMouse?.type === 'block'
        ? stopMouse.value
            .toPairs()
            .map((x) => x.value.type === 'value' && x.value.value)
            .filter((x) => x)
        : [];
    const props = {
      ...Object.keys(other).reduce(
        (res, k) => ({ ...res, [k]: toJs(info.props[k]) }),
        {},
      ),
      onkeydown:
        (keys?.push || stopKeyValues.length > 0) &&
        ((e) => {
          if (keys?.push) {
            keys.push({
              type: 'block',
              value: Block.fromPairs([
                ...(keys.type === 'block' ? keys.value.toPairs() : [])
                  .map((x) => ({
                    key: x.key,
                    value: fromJs(x.value.value !== 'up'),
                  }))
                  .filter((x) => x.value.value),
                { key: fromJs(e.key), value: fromJs('down') },
              ]),
            });
          }
          if (stopKeyValues.includes(e.key)) e.preventDefault();
        }),
      onkeyup:
        (keys?.push || stopKeyValues.length > 0) &&
        ((e) => {
          if (keys?.push) {
            keys.push({
              type: 'block',
              value: Block.fromPairs([
                ...(keys.type === 'block' ? keys.value.toPairs() : [])
                  .map((x) => ({
                    key: x.key,
                    value: fromJs(x.value.value !== 'up'),
                  }))
                  .filter((x) => x.value.value),
                { key: fromJs(e.key), value: fromJs('up') },
              ]),
            });
          }
          if (stopKeyValues.includes(e.key)) e.preventDefault();
        }),
      onmousedown:
        (mouse?.push || stopMouseValues.length > 0) &&
        ((e) => {
          const button = { 0: 'Left', 1: 'Middle', 2: 'Right' }[e.button];
          if (button) {
            node.__mouse = node.__mouse || {};
            node.__mouse.x = e.clientX;
            node.__mouse.y = e.clientY;
            node.__setMouseBoxBase({ [button]: 'down' });
            if (stopMouseValues.includes(button)) e.preventDefault();
          }
        }),
      onmouseup:
        (mouse?.push || stopMouseValues.length > 0) &&
        ((e) => {
          const button = { 0: 'Left', 1: 'Middle', 2: 'Right' }[e.button];
          if (button) {
            node.__mouse = node.__mouse || {};
            node.__mouse.x = e.clientX;
            node.__mouse.y = e.clientY;
            node.__setMouseBoxBase({ [button]: 'up' });
            if (stopMouseValues.includes(button)) e.preventDefault();
          }
        }),
      onclick:
        stopMouseValues.length > 0 &&
        ((e) => {
          const button = { 0: 'Left', 1: 'Middle', 2: 'Right' }[e.button];
          if (button && stopMouseValues.includes(button)) e.preventDefault();
        }),
      oncontextmenu:
        stopMouseValues.length > 0 &&
        ((e) => {
          if (stopMouseValues.includes('Right')) e.preventDefault();
        }),
      onmousemove:
        mouse?.push &&
        ((e) => {
          node.__mouse = node.__mouse || {};
          node.__mouse.x = e.clientX;
          node.__mouse.y = e.clientY;
          node.__setMouseBox();
        }),
      onmouseenter:
        mouse?.push &&
        ((e) => {
          node.__mouse = node.__mouse || {};
          node.__mouse.x = e.clientX;
          node.__mouse.y = e.clientY;
          node.__setMouseBoxBase();
        }),
      onmouseleave:
        mouse?.push &&
        (() => {
          node.__mouse = null;
          node.__setMouseBoxBase();
        }),
      onfocus: focus?.push && (() => focus?.push(fromJs(true))),
      onblur: focus?.push && (() => focus?.push(fromJs(false))),
      oninput:
        other.value?.push && ((e) => other.value?.push(fromJs(e.target.value))),
    } as any;

    if (other.focus?.value) setTimeout(() => node.focus());

    const diff = diffObjs(props, node.__props || {});
    applyObj(node, diff);
    node.__props = props;

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
