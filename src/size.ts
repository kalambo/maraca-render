import { ResizeObserver } from '@juggle/resize-observer';

const onSizeChanges = [] as any[];

const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) (entry.target as any).__resize();
});

window.addEventListener('resize', () => {
  for (const onChange of onSizeChanges) onChange();
});

export const observeSize = (node, onChange) => {
  if (!node.__resize) {
    onSizeChanges.push(onChange);
    node.__resize = onChange;
    resizeObserver.observe(node);
  }
};

export const unobserveSize = (node) => {
  if (node.__resize) {
    onSizeChanges.splice(onSizeChanges.indexOf(node.__resize), 1);
    delete node.__resize;
    resizeObserver.unobserve(node);
  }
};

export const updateSizes = () => onSizeChanges.forEach((x) => x());
