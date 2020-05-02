import { fromJs, toJs } from 'maraca';
import * as throttle from 'lodash.throttle';

import { Node, TextNode } from './node';
import Queue from './queue';
import { Children, createElement } from './util';

class Updater {
  push;
  throttled;
  current;
  constructor() {
    this.throttled = throttle((x) => {
      if (this.push) this.push(x);
    }, 50);
  }
  set(values, flush) {
    this.current = fromJs(values);
    this.throttled(this.current);
    if (flush) this.throttled.flush();
  }
  update({ push }) {
    if (this.push && push !== this.push) push(this.current);
    this.push = push;
  }
}

const buttonEvent = (get, set, stopButtons = [] as any[]) =>
  (set || stopButtons) &&
  ((e) => {
    const button = get(e);
    if (button) {
      if (set) set(button);
      if (stopButtons.includes(button)) e.preventDefault();
    }
  });

const getMouseButtons = (v) => {
  const [left, right, middle] = v
    .toString(2)
    .split('')
    .reverse()
    .map((x) => x === '1');
  const result = [] as string[];
  if (left) result.push('left');
  if (right) result.push('right');
  if (middle) result.push('middle');
  return result;
};

export default class Block {
  node;
  children = new Children();
  prev;
  box = new Updater();
  keys = new Queue();
  mousePos = {};
  mouse = new Queue();
  update(data) {
    if (data !== this.prev) {
      this.prev = data;

      const type =
        data.type === 'value'
          ? 'text'
          : toJs(data, { '': 'string' })[''] || 'div';
      if (type !== this.node?.type) {
        if (this.node) this.node.dispose();
        this.node =
          type === 'text'
            ? new TextNode()
            : new Node(createElement(type), (box, first) =>
                this.box.set(box, first),
              );
      }
      if (type === 'text') {
        this.node.update(data);
      } else {
        const {
          focus,
          value,
          box,
          keys,
          stopKeys,
          mouse,
          stopMouse,
          ...props
        } = toJs(data, {
          focus: () => 'boolean',
          value: () => 'string',
          box: () => null,
          keys: () => ({ '*': 'string' }),
          stopKeys: ['string'],
          mouse: () => ({ left: 'string', middle: 'string', right: 'string' }),
          stopMouse: ['string'],
          style: { '*': 'string' },
          '*': 'string',
        });

        this.node.runBox(box.push);
        this.box.update(box);

        this.keys.update(keys.value, (x) => keys.push && keys.push(fromJs(x)));
        this.mouse.update(
          mouse.value,
          (x) =>
            mouse.push && mouse.push(fromJs(x && { ...x, ...this.mousePos })),
        );

        this.node.updateProps({
          ...props,

          value: value.value || '',
          onfocus: focus.push && (() => focus.push(fromJs(true))),
          onblur: () => {
            this.keys.clear();
            if (focus.push) focus.push(fromJs(false));
          },
          oninput: value.push && ((e) => value.push(fromJs(e.target.value))),

          onkeydown: buttonEvent(
            (e) => e.key,
            keys.push && ((x) => this.keys.set(x, 'down')),
            stopKeys,
          ),
          onkeyup: buttonEvent(
            (e) => e.key,
            keys.push && ((x) => this.keys.set(x, 'up')),
            stopKeys,
          ),

          onmousedown: buttonEvent(
            (e) => ({ 0: 'left', 1: 'middle', 2: 'right' }[e.button]),
            mouse.push && ((x) => this.mouse.set(x, 'down')),
            stopMouse,
          ),
          onmouseup: buttonEvent(
            (e) => ({ 0: 'left', 1: 'middle', 2: 'right' }[e.button]),
            mouse.push && ((x) => this.mouse.set(x, 'up')),
            stopMouse,
          ),
          onclick: buttonEvent(
            (e) => ({ 0: 'left', 1: 'middle', 2: 'right' }[e.button]),
            null,
            stopMouse,
          ),
          oncontextmenu: buttonEvent(() => 'right', null, stopMouse),

          onmouseenter:
            mouse.push &&
            ((e) => {
              this.mousePos = { x: e.clientX, y: e.clientY };
              getMouseButtons(e.buttons).forEach((x) =>
                this.mouse.set(x, 'true'),
              );
              this.mouse.emit();
            }),
          onmousemove:
            mouse.push &&
            ((e) => {
              this.mousePos = { x: e.clientX, y: e.clientY };
              getMouseButtons(e.buttons).forEach((x) =>
                this.mouse.set(x, 'true'),
              );
              this.mouse.emit();
            }),
          onmouseleave: () => {
            this.mousePos = {};
            this.mouse.clear();
          },
        });

        if (focus.value) setTimeout(() => this.node.focus());

        const nodeChildren = this.children.update(
          data.value.toBoth().indices.filter((x) => x),
        );
        if (!props.innerHTML) this.node.updateChildren(nodeChildren);
      }
    }
  }
  dispose() {
    this.children.dispose();
    this.node.dispose();
  }
}
