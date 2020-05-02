const kebabToCamel = (s) =>
  s
    .split('-')
    .map((x, i) => (i === 0 ? x : `${x[0].toUpperCase()}${x.slice(1)}`))
    .join('');

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

const isObject = (x) => Object.prototype.toString.call(x) === '[object Object]';

export const diffObjs = (next, prev) => {
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

export const applyObj = (target, obj, first) => {
  Object.keys(obj).forEach((k) => {
    if (!isObject(obj[k])) {
      const key = first ? attributesMap[k] || k : k;
      try {
        if (['svg', 'path'].includes(target.tagName?.toLowerCase())) {
          target.setAttribute(key, obj[k] === undefined ? null : obj[k]);
        } else if (
          Object.prototype.toString.call(target) ===
          '[object CSSStyleDeclaration]'
        ) {
          target[kebabToCamel(k)] = obj[k] === undefined ? null : obj[k];
        } else {
          target[key] = obj[k] === undefined ? null : obj[k];
        }
      } catch {}
    } else {
      applyObj(target[k], obj[k], false);
    }
  });
  return target;
};
