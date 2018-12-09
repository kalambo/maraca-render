import * as crel from 'crel';

export const isNumber = x => !isNaN(x) && !isNaN(parseFloat(x));

export const toNumber = s => (isNumber(s) ? parseFloat(s) : 0);

export const split = s => (s || '').split(/\s+/).filter(v => v);

export const getValue = data => {
  if (data.type === 'nil') return null;
  if (data.type === 'value') return data.value;
  const keys = Object.keys(data.value.values);
  if (keys.length === 0) return data.value.indices.map(getValue);
  return keys.reduce(
    (res, k) => ({ ...res, k: getValue(data.value.values[k].value) }),
    {},
  );
};

export const extract = (values, ignore = [] as string[]) => {
  const keys = Object.keys(values);
  return {
    values: keys
      .map(key => ({
        key,
        value: ignore.includes(key)
          ? values[key].value
          : getValue(values[key].value),
      }))
      .filter(({ value }) => value)
      .reduce((res, { key, value }) => ({ ...res, [key]: value }), {} as any),
    setters: keys
      .map(key => ({ key, value: values[key].value.set }))
      .filter(({ value }) => value)
      .reduce((res, { key, value }) => ({ ...res, [key]: value }), {} as any),
  };
};

export const dom = (...args) => {
  const elem =
    args[0] === 'text' ? document.createTextNode(args[1]) : crel(...args);
  elem.__maraca = true;
  return elem;
};

export const getChildren = node =>
  ([] as any).slice.call(node.childNodes).filter(c => c.__maraca);

export const createElem = (depth, child) =>
  Array.from({ length: depth }).reduce(
    (res, _) => dom('div', res),
    typeof child === 'string' ? dom(child) : child,
  );

export const findElem = (node, depth) =>
  Array.from({ length: depth }).reduce(res => res && getChildren(res)[0], node);

export const toPx = s => {
  if (!s) return '';
  if (!Array.isArray(s)) return `${s}px`;
  return s.map(toPx).join(' ');
};
