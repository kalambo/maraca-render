import { toJs } from 'maraca';

import { disposeNode, updateNode } from './update';

const updateChildrenSet = (root, node, indices) => {
  const children = [...node.childNodes];
  for (let i = 0; i < Math.max(children.length, indices.length); i++) {
    const prev = children[i];
    if (!indices[i]) {
      disposeNode(root, prev);
      node.removeChild(prev);
    } else {
      const next = updateNode(root, indices[i], prev);
      if (!prev) {
        node.appendChild(next);
      } else if (next !== prev) {
        disposeNode(root, prev);
        node.replaceChild(next, prev);
      }
    }
  }
};

export default (root, node, indices) => {
  const mappedIndices = indices.map((data) => {
    if (data.type === 'value') return { data, type: 'text' };
    const type = toJs(data, { '': 'string' })[''] || 'div';
    return {
      data,
      type: type.startsWith(' ') ? type.slice(1) : type,
      root: type.startsWith(' '),
    };
  });
  updateChildrenSet(
    root,
    node,
    mappedIndices.filter((x) => !x.root),
  );
  const rootIndices = mappedIndices.filter((x) => x.root);
  if (rootIndices.length === 0) root.remove(node);
  else updateChildrenSet(root, root.get(node), rootIndices);
};
