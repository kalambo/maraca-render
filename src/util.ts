import * as throttle from 'lodash.throttle';

import Block from './block';

export class Children {
  blocks = [] as any[];
  update(indices, portals) {
    for (let i = indices.length; i < this.blocks.length; i++) {
      this.blocks[i].dispose(portals);
    }
    this.blocks.splice(indices.length);
    return indices.reduce((res, d, i) => {
      this.blocks[i] = this.blocks[i] || new Block();
      this.blocks[i].update(d, portals);
      const { node, portal = '' } = this.blocks[i];
      return node ? { ...res, [portal]: [...(res[portal] || []), node] } : res;
    }, {});
  }
  dispose(portals) {
    this.blocks.forEach((b) => {
      b.dispose(portals);
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

export class Throttled {
  func = null as any;
  throttled = null as any;
  withCurrent;
  current;
  constructor(withCurrent) {
    this.withCurrent = withCurrent;
  }
  update(func) {
    if (!func) {
      this.func = null;
      this.throttled = null;
    } else if (func !== this.func) {
      this.func = func;
      this.throttled = throttle(func, 50);
      if (this.current) func(this.current);
    }
  }
  run(value, flush) {
    if (this.withCurrent) this.current = value;
    this.throttled(value);
    if (flush) this.throttled.flush();
  }
}
