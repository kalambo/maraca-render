import {
  applyObj,
  cleanObj,
  createNode,
  diffObjs,
  findChild,
  getChildren,
} from './index';

export default {
  components: (node, component, args) => {
    const result = component(
      node && component === node.__component && node,
      ...args,
    );
    result.__component = component;
    return result;
  },
  props: (
    node,
    values,
    [settersValues, setters, settersMap] = [{}, {}, {}],
  ) => {
    const prev = node && node.__props;
    const cleanValues = cleanObj(values);
    const settersDiff = diffObjs(setters, prev && prev.setters);
    applyObj(node, {
      ...diffObjs(cleanValues, prev && prev.values),
      ...Object.keys(settersDiff).reduce(
        (res, k) => ({
          ...res,
          ...settersMap[k](
            settersDiff[k] || null,
            () => node.__props.settersValues,
          ),
        }),
        {},
      ),
    });
    node.__props = { values: cleanValues, setters, settersValues };
  },
  children: (node, indices, next, depth = 0, group = 0) => {
    const rows = getChildren(node);
    const children = group
      ? rows.reduce((res, n) => [...res, ...getChildren(n)], [])
      : rows;
    indices.forEach((d, index) => {
      const i = children.findIndex(c => c.__id === (d.id || index + 1));
      let child = i !== -1 && children.splice(i, 1)[0];
      const prev = child && findChild(child, depth);
      const result = next(prev, d);
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
};
