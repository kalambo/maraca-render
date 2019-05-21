import { createNodes, findChild, getChildren } from './utils';

export default (node, indices, next, depth = 0, group = 0) => {
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
        parent = createNodes('div')[0];
        node.appendChild(parent);
        rows.push(parent);
      }
      if (!prev) {
        child = createNodes(
          ...Array.from({ length: depth }).map(() => 'div'),
          result,
        )[0];
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
  return () => {
    const allChildren = group
      ? rows.reduce((res, n) => [...res, ...getChildren(n)], [])
      : rows;
    for (const c of allChildren) {
      const inner = findChild(c, depth);
      inner.__destroy();
    }
  };
};
