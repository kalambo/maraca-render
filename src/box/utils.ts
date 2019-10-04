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

const cleanObj = obj =>
  Object.keys(obj).reduce(
    (res, k) =>
      obj[k]
        ? { ...res, [k]: isObject(obj[k]) ? cleanObj(obj[k]) : obj[k] }
        : res,
    {},
  );

const mergeObjs = (objs: any[]) =>
  objs
    .map(x => x || {})
    .reduce((a, b) =>
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

export const updateNode = (node, ...props) => {
  const wrap = node.__wrap || (node.__wrap = wrapMethods());
  const cleaned = wrap(cleanObj(mergeObjs(props)));
  applyObj(node, diffObjs(cleaned, node.__props));
  node.__props = cleaned;
};
