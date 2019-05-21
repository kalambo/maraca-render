import { getChildren } from './utils';

export const padNode = (node, key, pad) => {
  const p = (node.__pad = node.__pad || [{}, {}, {}, {}]);
  pad.forEach((v, i) => (p[i][key] = v || 0));
  const totals = p.map(x =>
    Object.keys(x)
      .map(k => x[k])
      .reduce((a, b) => a + b, 0),
  );
  node.style.margin = totals.map(v => `${v < 0 ? v - 1 : 0}px`).join(' ');
  node.parentNode.style.padding = totals
    .map(v => `${v < 0 ? 1 : v}px`)
    .join(' ');
};

export const padText = (node, pad) => {
  const children = getChildren(node);
  const inline = children.map(
    c =>
      c.nodeType === 3 ||
      c.tagName === 'SPAN' ||
      c.tagName === 'INPUT' ||
      c.style.display === 'inline',
  );
  padNode(node, 'textParent', [
    inline[0] && Math.floor(pad),
    0,
    inline[children.length - 1] && Math.ceil(pad),
    0,
  ]);
  children.forEach((c, i) => {
    if (!inline[i]) {
      padNode(getChildren(c)[0], 'textSibling', [
        inline[i - 1] && Math.floor(pad),
        0,
        inline[i + 1] && Math.ceil(pad),
        0,
      ]);
    }
  });
};
