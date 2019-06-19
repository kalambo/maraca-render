import { createNodes, findChild, getChildren } from './utils';

const appendChild = (parent, child, spacers) => {
  if (spacers && parent.childNodes.length > 0) {
    parent.appendChild(createNodes('div')[0]);
  }
  parent.appendChild(child);
};
const removeChild = (child, spacers) => {
  const parent = child.parentNode;
  if (spacers) {
    const j = [...parent.childNodes].indexOf(child);
    if (j > 0) parent.removeChild(parent.childNodes[j - 1]);
  }
  parent.removeChild(child);
};

export default (node, indices, next, depth = 0, group = 0, spacers = false) => {
  const dep = depth - (group ? 1 : 0);
  const rows = getChildren(node).filter((_, i) => !spacers || i % 2 === 0);
  const children = group
    ? rows.reduce(
        (res, n) => [
          ...res,
          ...getChildren(n).filter((_, i) => !spacers || i % 2 === 0),
        ],
        [],
      )
    : rows;
  indices.forEach((d, index) => {
    let child = children.splice(0, 1)[0];
    const prev = child && findChild(child, dep);
    const result = next(prev, d);
    if (!result) {
      if (child) removeChild(child, spacers);
    } else {
      let parent = group ? rows[Math.floor(index / group)] : node;
      if (!parent) {
        parent = createNodes('div')[0];
        appendChild(node, parent, spacers);
        rows.push(parent);
      }
      if (!prev) {
        child = createNodes(
          ...Array.from({ length: dep }).map(() => 'div'),
          result,
        )[0];
        appendChild(parent, child, spacers);
      } else {
        if (result !== prev) prev.parentNode.replaceChild(result, prev);
        if (!dep) child = result;
        if (child.parentNode !== parent) {
          removeChild(child, spacers);
          appendChild(parent, child, spacers);
        }
      }
    }
  });
  children.forEach(child => {
    removeChild(child, spacers);
  });
  if (group) {
    rows.forEach(r => {
      if (getChildren(r).length === 0) removeChild(r, spacers);
    });
  }
  return () => {
    const rows = getChildren(node).filter((_, i) => !spacers || i % 2 === 0);
    const children = group
      ? rows.reduce(
          (res, n) => [
            ...res,
            ...getChildren(n).filter((_, i) => !spacers || i % 2 === 0),
          ],
          [],
        )
      : rows;
    for (const c of children) {
      const inner = findChild(c, dep);
      if (inner.__destroy) inner.__destroy();
    }
  };
};
