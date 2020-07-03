import { fromJs, toJs } from 'maraca';

import { Node, TextNode } from './node';
import Queue from './queue';
import { Children, createElement, Throttled } from './util';

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
  portal;
  children = new Children();
  prev;
  boxPush = new Throttled(true);
  keys = new Queue();
  mousePush = new Throttled(false);
  mousePos = {};
  mouse = new Queue();
  update(data, portals) {
    if (data !== this.prev) {
      this.prev = data;

      const type =
        data.type === 'value'
          ? 'text'
          : toJs(data, { '': 'string' })[''] || 'div';
      if (type !== this.node?.type) {
        if (this.node) this.node.dispose();
        this.node =
          type === 'text' ? new TextNode() : new Node(createElement(type));
      }
      if (type === 'text') {
        this.node.update(data);
      } else {
        this.portal = toJs(data, { portal: 'string' }).portal;

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

        this.boxPush.update(box.push);
        this.mousePush.update(mouse.push);

        this.keys.update(keys.value, (x) => keys.push && keys.push(fromJs(x)));
        this.mouse.update(
          mouse.value,
          (x, flush) =>
            this.mousePush.func &&
            this.mousePush.run(fromJs(x && { ...x, ...this.mousePos }), flush),
        );

        if (['svg', 'path'].includes(type)) {
          this.node.updateProps(props);
        } else {
          this.node.updateProps({
            ...props,

            onbox:
              this.boxPush.func &&
              ((x, flush) =>
                this.boxPush.func && this.boxPush.run(fromJs(x), flush)),

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
                this.mouse.emit(true);
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
        }

        if (!document.activeElement && focus.value) {
          setTimeout(() => this.node.focus());
        }

        const nodeChildren = this.children.update(data.value.indices, portals);
        if (!props.innerHTML) this.node.updateChildren(nodeChildren['']);
        Object.keys(portals).forEach((p) => {
          portals[p].render(this, nodeChildren[p]);
        });
      }
    }
  }
  dispose(portals) {
    Object.keys(portals).forEach((p) => {
      portals[p].render(this);
    });
    this.children.dispose(portals);
    this.node.dispose();
  }
}
