import { fromJs } from 'maraca';

// import { ResizeObserver } from '@juggle/resize-observer';
// setResize = memo(false, false, node => {
//   if (this.observer !== false) {
//     if (this.observer) {
//       this.observer.disconnect();
//       this.observer = null;
//     }
//     if (node) {
//       this.observer = new ResizeObserver(entries => {
//         const { inlineSize, blockSize } = entries[0].borderBoxSize[0];
//         this.onResize(inlineSize, blockSize);
//       });
//       this.observer.observe(node);
//     }
//   }
// });
// this.onResize = (width, height) => {
//   if (values.width?.push) values.width?.push(fromJs(width));
//   if (values.height?.push) values.height?.push(fromJs(height));
// };
// setTimeout(() =>
//   this.setResize(
//     values.width?.push || values.height?.push
//       ? document.getElementById(this.id)
//       : null,
//   ),
// );

const toJs = data => {
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
const unpack = value => {
  const result = { values: {} as any, indices: [] as any[] };
  value.toPairs().forEach(({ key, value }) => {
    if (key.type !== 'box') {
      const i = toIndex(key.value || '');
      if (i) result.indices[i - 1] = value;
      else result.values[key.value || ''] = value;
    }
  });
  return result;
};

const isObject = x => Object.prototype.toString.call(x) === '[object Object]';
const diffObjs = (next, prev) => {
  const result = {};
  Array.from(
    new Set([...Object.keys(next), ...Object.keys(prev || {})]),
  ).forEach(k => {
    if (next[k] !== (prev || {})[k]) {
      result[k] = isObject(next[k])
        ? diffObjs(next[k], (prev || {})[k])
        : next[k];
    }
  });
  return result;
};
const applyObj = (target, obj) => {
  Object.keys(obj).forEach(k => {
    if (!isObject(obj[k])) {
      target[k] = obj[k] === undefined ? null : obj[k];
    } else {
      applyObj(target[k], obj[k]);
    }
  });
  return target;
};

const createNode = type =>
  type === 'text' ? document.createTextNode('') : document.createElement(type);

const getNodeInfo = data => {
  if (data.type === 'value') return { type: 'text', props: data.value };
  const {
    values: { ['']: type, ...props },
    indices,
  } = unpack(data.value);
  return { type: type?.type === 'value' ? type.value : 'div', props, indices };
};

const getNode = (data, prev) => {
  if (prev?.__data === data) return prev;

  const info = getNodeInfo(data);
  const node =
    info.type === prev?.nodeName.replace('#', '').toLowerCase()
      ? prev
      : createNode(info.type);
  if (info.type === 'text') {
    node.textContent = info.props;
  } else {
    const { hover, click, enter, focus, ...otherProps } = info.props;
    const props = {
      ...Object.keys(otherProps).reduce(
        (res, k) => ({ ...res, [k]: toJs(info.props[k]) }),
        {},
      ),
      onmouseenter: hover?.push && (() => hover?.push(fromJs(true))),
      onmouseleave: hover?.push && (() => hover?.push(fromJs(false))),
      onmousedown:
        click?.push &&
        (e => {
          if (e.button === 0) click?.push(fromJs(null));
        }),
      onkeypress:
        enter?.push &&
        (e => {
          if (e.keyCode === 13) enter?.push(fromJs(null));
        }),
      onfocus: focus?.push && (() => focus?.push(fromJs(true))),
      onblur: focus?.push && (() => focus?.push(fromJs(false))),
      oninput:
        otherProps.value?.push &&
        (e => otherProps.value?.push(fromJs(e.target.value))),
    } as any;

    // ? {
    //   overflow: 'hidden',
    //   cursor: 'pointer',
    //   userSelect: 'none',
    //   WebkitUserSelect: 'none',
    //   MozUserSelect: 'none',
    //   msUserSelect: 'none',
    // }

    if (focus?.value) setTimeout(() => node.focus());

    const diff = diffObjs(props, node.__props || {});
    applyObj(node, diff);
    node.__props = props;
    updateChildren(node, info.indices);
  }
  node.__data = data;
  return node;
};

const updateChildren = (node, indices) => {
  const children = [...node.childNodes];
  for (let i = 0; i < Math.max(children.length, indices.length); i++) {
    if (!indices[i]) {
      node.removeChild(children[i]);
    } else {
      const prev = children[i];
      const next = getNode(indices[i], prev);
      if (!prev) node.appendChild(next);
      else if (next !== prev) node.replaceChild(next, prev);
    }
  }
};

export default node => data => {
  if (data) {
    updateChildren(node, [data]);
  } else {
    while (node.lastChild) node.removeChild(node.lastChild);
  }
};
