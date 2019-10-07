import { toJs } from 'maraca';

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
export const createNodes: any = (base, ...nodes) => {
  const result = [typeof base === 'string' ? createElem(base) : base];
  nodes.forEach((n, i) => {
    result.push(typeof n === 'string' ? createElem(n) : n);
    result[i].appendChild(result[i + 1]);
  });
  return result;
};

export const getChildren = node =>
  node && ([] as any).slice.call(node.childNodes).filter(c => c.__maraca);

export const findChild = (node, depth): any =>
  Array.from({ length: depth }).reduce(res => res && getChildren(res)[0], node);

const toIndex = (v: string) => {
  const n = parseFloat(v);
  return !isNaN(v as any) && !isNaN(n) && n === Math.floor(n) && n > 0 && n;
};
export const unpackData = (data, withIndices = true) => {
  const result = {
    values: data.type === 'value' ? data.value : {},
    indices: [] as any[],
  };
  if (data.type === 'list') {
    data.value.forEach(({ key, value }) => {
      if (key.type !== 'list') {
        const i = withIndices && toIndex(key.value || '');
        if (i) result.indices[i - 1] = value;
        else result.values[key.value || ''] = value;
      }
    });
  }
  return result;
};

const getValues = (values, config, map?) => {
  const result = Object.keys(config).reduce((res, k) => {
    if (values[k]) {
      const result = parseValue(values[k], config[k]);
      if (result !== null) return { ...res, [k]: result };
    }
    return res;
  }, {});
  return map ? map(result) : result;
};
const parseValueInner = (data, config) => {
  if (!config) return null;
  if (typeof config === 'object') {
    if (data.type !== 'list') return {};
    return getValues(data.value.values, config);
  }
  if (config === true) return data;
  const { type, value } = data;
  if (config === 'boolean') return !!value;
  if (config === 'string') return type === 'value' ? value : null;
  const v = type !== 'list' ? toJs(data) : null;
  if (['integer', 'number'].includes(config)) {
    if (typeof v !== 'number') return null;
    return config === 'number' ? v : Math.floor(v) === v ? v : null;
  }
  if (config === 'date') {
    return Object.prototype.toString.call(v) === '[object Date]' ? v : null;
  }
  if (config === 'location') {
    return typeof v === 'object' ? v : null;
  }
  return null;
};
export const parseValue = (
  data = { type: 'value', value: '' } as any,
  config,
  defaultValue = null as any,
) => {
  const result = parseValueInner(data, config);
  if (result === null) return defaultValue;
  return result;
};

export const getSetters = (values, setters) =>
  setters.reduce((res, k) => {
    if (values[k] && values[k].set) {
      return { ...res, [k]: values[k].set };
    }
    return res;
  }, {});

export const shallowEqual = (objA, objB) => {
  if (objA === objB) return true;
  if (!objA || !objB) return false;
  if (typeof objA !== 'object' || typeof objB !== 'object') return false;
  const aKeys = Object.keys(objA);
  if (Object.keys(objB).length !== aKeys.length) return false;
  for (let i = 0; i < aKeys.length; i++) {
    const key = aKeys[i];
    if (objA[key] !== objB[key]) return false;
  }
  return true;
};
