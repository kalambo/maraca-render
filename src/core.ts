import {
  applyObj,
  cleanObj,
  createNode,
  createTextNode,
  diffObjs,
  findChild,
  getChildren,
  getSetters,
  parseValues,
} from './utils';

const updateNode = (modes, mode, data, node, parent) => {
  if (data.type === 'nil') return null;
  if (data.type === 'value') {
    if (!node || node.nodeType !== 3) return createTextNode(data.value);
    node.nodeValue = data.value;
    return node;
  }
  const m = parseValues({ '': 'string' }, data.value.values)[''] || mode;
  const result = modes[m](
    data.value,
    node && m === node.__mode && node,
    parent,
  );
  result.__mode = m;
  return result;
};

export const updateChildren = (
  modes,
  mode,
  node,
  indices,
  values = {},
  depth = 0,
  group = 0,
) => {
  const rows = getChildren(node);
  const children = group
    ? rows.reduce((res, n) => [...res, ...getChildren(n)], [])
    : rows;
  indices.forEach((d, index) => {
    const i = children.findIndex(c => c.__id === (d.id || index + 1));
    let child = i !== -1 && children.splice(i, 1)[0];
    const prev = child && findChild(child, depth);
    const next = updateNode(modes, mode, d, prev, values);
    if (!next) {
      if (child) child.parentNode.removeChild(child);
    } else {
      let parent = group ? rows[Math.floor(index / group)] : node;
      if (!parent) {
        parent = createNode('div');
        node.appendChild(parent);
        rows.push(parent);
      }
      if (!prev) {
        child = createNode(next, depth);
        parent.appendChild(child);
      } else if (next !== prev) {
        if (!depth) child = next;
        prev.parentNode.replaceChild(next, prev);
        if (child.parentNode !== parent) {
          child.parentNode.removeChild(child);
          parent.appendChild(child);
        }
      }
      const rowIndex = group ? index % group : index;
      if (child !== parent.childNodes[rowIndex]) {
        parent.insertBefore(child, parent.childNodes[rowIndex]);
      }
      child.__id = d.id || index + 1;
    }
  });
  children.forEach(child => {
    child.parentNode.removeChild(child);
  });
  if (group) {
    rows.forEach(r => {
      if (getChildren(r).length === 0) node.removeChild(r);
    });
  }
};

export const updateProps = (node, values, [setters, settersMap] = [{}, {}]) => {
  const prev = node && node.__data;
  const cleanValues = cleanObj(values);
  const settersDiff = diffObjs(setters, prev && prev.setters);
  applyObj(node, {
    ...diffObjs(cleanValues, prev && prev.values),
    ...Object.keys(settersDiff).reduce(
      (res, k) => ({
        ...res,
        ...settersMap[k](settersDiff[k] || null, cleanValues),
      }),
      {},
    ),
  });
  node.__data = { values: cleanValues, setters };
};

export const updateSimple = (modes, mode, tag, values, setters) => (
  data,
  node,
  parent,
) => {
  const result = node || createNode(tag);
  const vals = Array.isArray(values)
    ? values[1](parseValues(values[0], data.values), parent)
    : values;
  if (mode) updateChildren(modes, mode, result, data.indices);
  updateProps(result, vals, getSetters(setters, data.values));
  return result;
};
