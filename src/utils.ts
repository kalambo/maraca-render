import { toJs } from 'maraca';

export const isNumber = x => !isNaN(x) && !isNaN(parseFloat(x));

export const isInteger = x => {
  if (!isNumber(x)) return false;
  const n = parseFloat(x);
  return Math.floor(n) === n;
};

export const isObject = x =>
  Object.prototype.toString.call(x) === '[object Object]';

export const toNumber = s => (isNumber(s) ? parseFloat(s) : 0);

export const toPx = s => {
  if (!s) return null;
  if (!Array.isArray(s)) return `${s}px`;
  return s.map(x => toPx(x || '0')).join(' ');
};

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

export const getChildren = node =>
  node && ([] as any).slice.call(node.childNodes).filter(c => c.__maraca);

export const findChild = (node, depth): any =>
  Array.from({ length: depth }).reduce(res => res && getChildren(res)[0], node);

export const createNodes: any = (base, ...nodes) => {
  const result = [typeof base === 'string' ? createElem(base) : base];
  nodes.forEach((n, i) => {
    result.push(typeof n === 'string' ? createElem(n) : n);
    result[i].appendChild(result[i + 1]);
  });
  return result;
};

export const cleanObj = obj =>
  Object.keys(obj).reduce(
    (res, k) =>
      obj[k]
        ? { ...res, [k]: isObject(obj[k]) ? cleanObj(obj[k]) : obj[k] }
        : res,
    {},
  );

export const mergeObjs = (objs: any[]) =>
  objs.reduce((a, b) =>
    Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).reduce(
      (res, k) => ({
        ...res,
        [k]:
          isObject(a[k]) && isObject(b[k])
            ? mergeObjs([a[k], b[k]])
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

export const parseValue = (
  config,
  data = { type: 'value', value: '' } as any,
) => {
  if (!config) return null;
  if (typeof config === 'object') {
    if (data.type !== 'list') return {};
    return getValues(data.value.values, config);
  }
  if (config === true) return data;
  const { type, value } = data;
  if (config === 'boolean') return !!value;
  if (config === 'string') return type === 'value' && value;
  const v = type !== 'list' ? toJs(data) : null;
  if (['integer', 'number'].includes(config)) {
    if (typeof v !== 'number') return false;
    return (config === 'number' || Math.floor(v) === v) && v;
  }
  if (config === 'date') {
    return Object.prototype.toString.call(v) !== '[object Date]' && v;
  }
  if (config === 'location') {
    return typeof v === 'object' && v;
  }
  return null;
};

export const getValues = (values, config, map?) => {
  const result = Object.keys(config).reduce((res, k) => {
    if (values[k]) {
      const result = parseValue(config[k], values[k]);
      if (result) return { ...res, [k]: result };
    }
    return res;
  }, {});
  return map ? map(result) : result;
};

export const getSetters = (values, setters) =>
  setters.reduce((res, k) => {
    if (values[k] && values[k].set) {
      return { ...res, [k]: values[k].set };
    }
    return res;
  }, {});

const toIndex = (v: string) => {
  const n = parseFloat(v);
  return !isNaN(v as any) && !isNaN(n) && n === Math.floor(n) && n > 0 && n;
};
export const unpackList = data => {
  const result = { values: {}, indices: [] as any[] };
  data.forEach(({ key, value }) => {
    if (key.type !== 'list') {
      const i = toIndex(key.value || '');
      if (i) result.indices[i - 1] = value;
      else result.values[key.value || ''] = value;
    }
  });
  return result;
};

export const wrapMethods = () => {
  const base = {};
  const wrapped = {};
  return obj => {
    const result = {};
    Object.keys(obj).forEach(k => {
      if (typeof obj[k] === 'function') {
        base[k] = obj[k];
        wrapped[k] = wrapped[k] || ((...args) => base[k](...args));
        result[k] = wrapped[k];
      } else {
        result[k] = obj[k];
      }
    });
    return result;
  };
};
