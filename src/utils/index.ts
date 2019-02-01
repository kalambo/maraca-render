import { compare, toData, toTypedValue } from 'maraca';
import * as prettier from 'prettier/standalone';

export { default as dom } from './dom';
import * as printMaraca from './print';
export { default as update } from './update';

export const isNumber = x => !isNaN(x) && !isNaN(parseFloat(x));

export const isInteger = x => {
  if (!isNumber(x)) return false;
  const n = parseFloat(x);
  return Math.floor(n) === n;
};

export const isObject = x =>
  Object.prototype.toString.call(x) === '[object Object]';

export const toNumber = s => (isNumber(s) ? parseFloat(s) : 0);

export const split = s => (s || '').split(/\s+/).filter(v => v);

export const createTextNode = text => {
  const result = document.createTextNode(text);
  (result as any).__maraca = true;
  return result;
};

const createElem = (tag, child?) => {
  const result = document.createElement(tag);
  if (child) result.appendChild(child);
  (result as any).__maraca = true;
  return result;
};

export const createNode = (child, depth = 0) =>
  Array.from({ length: depth }).reduce(
    (res, _) => createElem('div', res),
    typeof child === 'string' ? createElem(child) : child,
  );

export const getChildren = node =>
  node && ([] as any).slice.call(node.childNodes).filter(c => c.__maraca);

export const findChild = (node, depth) =>
  Array.from({ length: depth }).reduce(res => res && getChildren(res)[0], node);

export const cleanObj = obj =>
  Object.keys(obj).reduce(
    (res, k) =>
      obj[k]
        ? { ...res, [k]: isObject(obj[k]) ? cleanObj(obj[k]) : obj[k] }
        : res,
    {},
  );

export const mergeObjs = (...objs) =>
  objs.reduce((a, b) =>
    Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).reduce(
      (res, k) => ({
        ...res,
        [k]:
          isObject(a[k]) && isObject(b[k])
            ? mergeObjs(a[k], b[k])
            : b[k] === undefined
            ? a[k]
            : b[k],
      }),
      {},
    ),
  );

export const diffObjs = (next, prev) => {
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

export const applyObj = (target, obj) => {
  Object.keys(obj).forEach(k => {
    if (!isObject(obj[k])) {
      target[k] = obj[k] === undefined ? null : obj[k];
    } else {
      applyObj(target[k], obj[k]);
    }
  });
  return target;
};

export const parseValue = (config, data) => {
  if (!config) return null;
  if (typeof config === 'object') {
    if (data.type !== 'list') return {};
    return getValues(data.value.values, config);
  }
  if (config === true) return data;
  const { type, value } = data;
  if (config === 'boolean') return type !== 'nil';
  if (config === 'string') return type === 'value' && value;
  if (['integer', 'number', 'time', 'location'].includes(config)) {
    const typed = toTypedValue(data);
    if (config !== 'integer') return typed.type === config && typed.value;
    else return typed.integer && typed.value;
  }
  return null;
};

export const getValues = (values, config, map?) => {
  const result = Object.keys(config).reduce((res, k) => {
    if (values[k]) {
      const result = parseValue(config[k], values[k].value);
      if (result) return { ...res, [k]: result };
    }
    return res;
  }, {});
  return map ? map(result) : result;
};

export const getSetters = (values, config, setters) =>
  [
    getValues(values, config),
    Object.keys(setters).reduce((res, k) => {
      if (values[k] && values[k].value.set) {
        return { ...res, [k]: values[k].value.set };
      }
      return res;
    }, {}),
    setters,
  ] as [any, any, any];

export const valueComponents = {
  nil: () => null,
  value: (node, data) => {
    if (!node) return createTextNode(data.value);
    node.nodeValue = data.value;
    return node;
  },
};

const print = value => {
  if (value.type !== 'list') {
    return `"${(value.value || '').replace(/"/g, '""')}"`;
  }
  return `[${[
    ...value.value.indices.map((v, i) => ({
      index: true,
      key: toData(i + 1),
      value: v,
    })),
    ...Object.keys(value.value.values).map(k => value.value.values[k]),
  ]
    .sort((a, b) => compare(a.key, b.key))
    .map(({ index, key, value }) =>
      index ? print(value) : `${print(key)}: ${print(value)}`,
    )
    .join(', ')}]`;
};

export const printValue = (value, printWidth?) =>
  prettier.format(print(value), {
    parser: 'maraca',
    plugins: [printMaraca],
    printWidth: Math.min(80, printWidth || 40),
  });
