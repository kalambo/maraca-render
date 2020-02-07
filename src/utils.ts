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

export const parseDirs = s => {
  const parts = split(s);
  if (parts.length === 0) return null;
  return [
    parts[0] || 0,
    parts[3] || parts[1] || parts[0] || 0,
    parts[2] || parts[0] || 0,
    parts[1] || parts[0] || 0,
  ].map(toNumber);
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
export const parseValue = (
  data = { type: 'value', value: '' } as any,
  config,
) => {
  if (!config) return null;
  if (typeof config === 'object') {
    if (data.type !== 'list') return {};
    return getValues(data.value.toObject(), config);
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

export const getPushers = (values, pushers) =>
  pushers.reduce((res, k) => {
    if (values[k] && values[k].push) {
      return { ...res, [k]: values[k].push };
    }
    return res;
  }, {});

const shallowEqual = (objA, objB) => {
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
export const memo = (...args) => {
  const func = args.pop();
  let prevValues;
  let result;
  return (...values) => {
    if (
      !prevValues ||
      prevValues.some((p, i) =>
        args[i] ? !shallowEqual(p, values[i]) : p !== values[i],
      )
    ) {
      prevValues = values;
      result = func(...values);
    }
    return result;
  };
};

const toIndex = (v: string) => {
  const n = parseFloat(v);
  return !isNaN(v as any) && !isNaN(n) && n === Math.floor(n) && n > 0 && n;
};

export const unpack = data => {
  const result = {
    values: data.type === 'value' ? data.value : {},
    indices: [] as any[],
  };
  if (data.type === 'list') {
    data.value.forEach(({ key, value }) => {
      if (key.type !== 'list') {
        const i = toIndex(key.value || '');
        if (i) result.indices[i - 1] = value;
        else result.values[key.value || ''] = value;
      }
    });
  }
  return result;
};
