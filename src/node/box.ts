import { ResizeObserver } from '@juggle/resize-observer';

const onBoxChanges = [] as any[];
export const updateBoxes = () => onBoxChanges.forEach((x) => x());

if (typeof window !== 'undefined') {
  window.addEventListener('resize', updateBoxes);
}

const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) (entry.target as any).__emitBox();
});

export const observeBox = (node, onChange) => {
  if (!node.__emitBox) {
    const emitBox = (first = false) => {
      const { top, left, height, width } = node.getBoundingClientRect();
      onChange({ top, left, height, width }, first);
    };
    onBoxChanges.push(emitBox);
    node.__emitBox = () => emitBox(true);
    resizeObserver.observe(node);
    setTimeout(() => {
      node.__emitBox = emitBox;
    });
  }
};

export const unobserveBox = (node) => {
  if (node.__emitBox) {
    onBoxChanges.splice(onBoxChanges.indexOf(node.__emitBox), 1);
    delete node.__emitBox;
    resizeObserver.unobserve(node);
  }
};
