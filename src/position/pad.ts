import { getChildren } from '../utils';

export const padNode = (
  node,
  key,
  { top = 0 as any, left = 0 as any, bottom = 0 as any, right = 0 as any },
) => {
  const p = (node.__pad = node.__pad || [{}, {}, {}, {}]);
  [top, right, bottom, left].forEach((v, i) => (p[i][key] = v || 0));
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
  padNode(node, 'textParent', {
    top: inline[0] && Math.floor(pad),
    bottom: inline[children.length - 1] && Math.ceil(pad),
  });
  children.forEach((c, i) => {
    if (!inline[i]) {
      padNode(getChildren(c)[0], 'textSibling', {
        top: inline[i - 1] && Math.floor(pad),
        bottom: inline[i + 1] && Math.ceil(pad),
      });
    }
  });
};
