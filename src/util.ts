import Block from './block';

export class Children {
  blocks = [] as any[];
  update(indices) {
    for (let i = indices.length; i < this.blocks.length; i++) {
      this.blocks[i].dispose();
    }
    this.blocks.splice(indices.length);
    return indices
      .map((d, i) => {
        this.blocks[i] = this.blocks[i] || new Block();
        this.blocks[i].update(d);
        return this.blocks[i].node;
      })
      .filter((x) => x);
  }
  dispose() {
    this.blocks.forEach((b) => {
      b.dispose();
    });
  }
}

export const createElement = (type) => {
  if (['svg', 'path'].includes(type)) {
    return document.createElementNS('http://www.w3.org/2000/svg', type);
  }
  try {
    return document.createElement(type);
  } catch {
    return document.createElement('div');
  }
};
