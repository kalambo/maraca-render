import { getChildren } from './utils';

export const setPad = (
  key,
  node,
  { top = 0 as any, left = 0 as any, bottom = 0 as any, right = 0 as any },
) => {
  const p = (node.__pad = node.__pad || [{}, {}, {}, {}]);
  [top, right, bottom, left].forEach((v, i) => (p[i][key] = v || 0));
  const totals = p.map(x => {
    const values = Object.keys(x).map(k => x[k]);
    if (values.some(v => v === 'auto')) return 'auto';
    return values.reduce((a, b) => a + b, 0);
  });
  const child = getChildren(node)[0];
  if (child) {
    child.style.margin = totals
      .map(v => (v === 'auto' ? 'auto' : `${v < 0 ? v - 1 : 0}px`))
      .join(' ');
  }
  node.style.padding = totals
    .map(v => (v === 'auto' ? 0 : `${v < 0 ? 1 : v}px`))
    .join(' ');
};

export const padText = (node, values) => {
  if (node.tagName === 'DIV') {
    const newChildren = getChildren(node);
    const inline = newChildren.map(
      c => c.nodeType === 3 || c.tagName === 'SPAN' || c.tagName === 'INPUT',
    );
    const pad = Math.floor(values.fontSize * (values.lineHeight - 1)) * -0.5;
    setPad('innerText', node.parentNode, {
      top: inline[0] && Math.floor(pad),
      bottom: inline[newChildren.length - 1] && Math.ceil(pad),
    });
    newChildren.forEach((c, i) => {
      if (c.tagName === 'DIV') {
        setPad('outerText', c, {
          top: inline[i - 1] && Math.floor(pad),
          bottom: inline[i + 1] && Math.ceil(pad),
        });
      }
    });
  }
};
