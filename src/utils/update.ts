import {
  applyObj,
  cleanObj,
  createNode,
  createTextNode,
  diffObjs,
  findChild,
  getChildren,
} from './index';

export default {
  list: render => (node, data, next) => {
    if (data.type === 'nil') return null;
    if (data.type === 'value') {
      if (!node || node.nodeType !== 3) return createTextNode(data.value);
      node.nodeValue = data.value;
      return node;
    }
    return render(node, data.value.values, data.value.indices, next);
  },
  components: (node, components, component, key, args, other?) => {
    if (!components[component]) return other();
    const result = components[component](
      node && component === node[`__${key}`] && node,
      ...args,
    );
    result[`__${key}`] = component;
    return result;
  },
  children: (node, indices, update, depth = 0, group = 0) => {
    const rows = getChildren(node);
    const children = group
      ? rows.reduce((res, n) => [...res, ...getChildren(n)], [])
      : rows;
    indices.forEach((d, index) => {
      const i = children.findIndex(c => c.__id === (d.id || index + 1));
      let child = i !== -1 && children.splice(i, 1)[0];
      const prev = child && findChild(child, depth);
      const result = update(prev, d);
      if (!result) {
        if (child) child.parentNode.removeChild(child);
      } else {
        let parent = group ? rows[Math.floor(index / group)] : node;
        if (!parent) {
          parent = createNode('div');
          node.appendChild(parent);
          rows.push(parent);
        }
        if (!prev) {
          child = createNode(result, depth);
          parent.appendChild(child);
        } else if (result !== prev) {
          if (!depth) child = result;
          prev.parentNode.replaceChild(result, prev);
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
  },
  props: (node, values, [setters, settersMap] = [{}, {}]) => {
    const prev = node && node.__props;
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
    node.__props = { values: cleanValues, setters };
  },
};
