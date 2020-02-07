import { html, render } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';
import { styleMap } from 'lit-html/directives/style-map';
import { fromJs } from 'maraca';
import { ResizeObserver } from '@juggle/resize-observer';
import * as uuid from 'uuid/v1';

import parseBox from './box';
import parseCols from './cols';
import parseSize from './size';
import parseStyle from './style';
import { memo, parseValue, toPx, unpack } from './utils';

const getDirs = (top = 0, bottom = 0, left = 0, right = 0) =>
  [top, right, bottom, left].map(s => `${s}px`).join(' ');

class Node {
  indexNodes = [] as Node[];
  id = uuid();
  update = memo(false, false, (data, context) => {
    if (data.type === 'value') return this.render(data.value, [], context);

    const {
      values: { style, color, ...values },
      indices,
    } = unpack(data);
    const ctx = this.getContext({ style, color, input: values.input }, context);

    if (values.image || values.input) {
      indices.forEach((d, i) => (values[i + 1] = d));
      indices.splice(0);
    }
    for (let i = indices.length; i < this.indexNodes.length; i++) {
      this.indexNodes[i].dispose();
      delete this.indexNodes[i];
    }
    const children = indices.map((d, i) => {
      this.indexNodes[i] = this.indexNodes[i] || new Node();
      return this.indexNodes[i].update(d, ctx);
    });

    return this.render(values, children, ctx);
  });

  getContext = memo(true, false, (values, { noWrap, ...context }) =>
    parseStyle(values, context),
  );
  observer;
  onResize;
  setResize = memo(false, false, node => {
    if (this.observer !== false) {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      if (node) {
        this.observer = new ResizeObserver(entries => {
          const { inlineSize, blockSize } = entries[0].borderBoxSize[0];
          this.onResize(inlineSize, blockSize);
        });
        this.observer.observe(node);
      }
    }
  });
  render = memo(false, true, false, (values, children, context) => {
    if (typeof values === 'string') return { type: 'inline', node: values };

    const box = parseBox(values);
    const size = parseSize(values);
    // prettier-ignore
    const renderBox = (styles, content, type) =>
      html`<div
        id=${this.id}
        @mouseenter=${box.onmouseenter}
        @mouseleave=${box.onmouseleave}
        @mousedown=${box.onmousedown}
        @keypress=${box.onkeypress}
        style=${styleMap({ ...box.style, ...styles, ...size })}
        data-type=${type}
        ><div>${content}</div></div
      >`;

    this.onResize = (width, height) => {
      if (values.width?.push) values.width?.push(fromJs(width));
      if (values.height?.push) values.height?.push(fromJs(height));
    };
    setTimeout(() =>
      this.setResize(
        values.width?.push || values.height?.push
          ? document.getElementById(this.id)
          : null,
      ),
    );

    if (values.image) {
      return {
        type: 'basic',
        node: renderBox(
          {},
          html`
            <img
              src=${parseValue(values.image, 'string')}
              style="width: 100%"
            />
          `,
          'image',
        ),
      };
    }

    const textStyle = {
      fontSize: `${context.size}px`,
      minHeight: `${context.size}px`,
      lineHeight: `${Math.floor(context.height * context.size)}px`,
      fontWeight: context.weight,
      fontStyle: context.style,
      fontFamily: context.font,
      textAlign: context.align,
      textDecoration: context.strike && 'line-through',
      whiteSpace: context.exact && 'pre',
      color: context.color,
    };

    if (context.flow) {
      return {
        type: 'inline',
        node: renderBox(
          { display: 'inline', ...textStyle },
          repeat<any>(
            children,
            (_, i) => i,
            c => c.node,
          ),
          'flow',
        ),
      };
    }

    if (values.input) {
      // if (parseValue(values.focus, 'boolean')) setTimeout(() => inner.focus());
      return {
        type: 'basic',
        node: renderBox(
          {
            padding: getDirs(
              box.pad[0] + 1,
              box.pad[2] + 1,
              box.pad[3],
              box.pad[1],
            ),
          },
          html`
            <div
              style=${styleMap({
                margin: getDirs(
                  Math.floor(context.pad) - 1,
                  Math.ceil(context.pad) - 1,
                ),
              })}
            >
              <input
                type=${context.hidden ? 'password' : 'text'}
                value=${parseValue(values.input, 'string') || ''}
                @input=${values.input.push &&
                  (e => values.input.push(fromJs(e.target.value)))}
                @focus=${values.focus?.push &&
                  (() => values.focus.push(fromJs(true)))}
                @blur=${values.focus?.push &&
                  (() => values.focus.push(fromJs(false)))}
                style=${styleMap(textStyle)}
              />
            </div>
          `,
          'input',
        ),
      };
    }

    // bullet
    // result.display = 'list-item';
    // result.listStylePosition = 'inside';

    //         tableLayout:
    //           childProps.some(p => p.size && p.size.width !== 'auto') ||
    //           cols.equal ||
    //           gap
    //             ? 'fixed'
    //             : 'auto',

    //         display: 'table-cell',
    //         width: cols.equal && `${100 / cols.cols}%`,

    const cols = parseCols(values, children.length);
    if (cols) {
      return {
        type: 'basic',
        node: renderBox(
          {
            ...textStyle,
            display: 'table',
            tableLayout: 'fixed',
            width: '100%',
            padding: toPx(box.pad),
          },
          repeat(
            Array.from({ length: Math.ceil(children.length / cols.cols) }),
            (_, i) => i,
            (_, i) =>
              html`
                ${i
                  ? html`
                      <div
                        style=${styleMap({
                          display: 'table-row',
                          height: toPx(cols.gap[0]),
                        })}
                      />
                    `
                  : null}
                <div style="display: table-row">
                  ${repeat(
                    Array.from({ length: cols.cols })
                      .map((_, j) => children[i * cols.cols + j])
                      .filter(c => c),
                    (_, i) => i,
                    ({ type, node }, j) =>
                      html`
                        ${j
                          ? html`
                              <div
                                style=${styleMap({
                                  display: 'table-cell',
                                  width: toPx(cols.gap[1]),
                                })}
                              />
                            `
                          : null}
                        ${type === 'inline'
                          ? html`
                              <div
                                style=${styleMap({
                                  display: 'table-cell',
                                  padding: '1px 0',
                                })}
                              >
                                <div
                                  style=${styleMap({
                                    margin: getDirs(
                                      Math.floor(context.pad) - 1,
                                      Math.ceil(context.pad) - 1,
                                    ),
                                  })}
                                >
                                  ${node}
                                </div>
                              </div>
                            `
                          : type === 'box'
                          ? node('table-cell')
                          : html`
                              <div style=${styleMap({ display: 'table-cell' })}>
                                ${node}
                              </div>
                            `}
                      `,
                  )}
                </div>
              `,
          ),
          'cols',
        ),
      };
    }

    const isInline = children.map(c => c.type === 'inline');
    return {
      type: 'box',
      node: (display = 'block') =>
        renderBox(
          {
            padding: getDirs(
              box.pad[0] + 1,
              box.pad[2] + 1,
              box.pad[3],
              box.pad[1],
            ),
            display,
          },
          html`
            <div
              style=${styleMap({
                ...textStyle,
                margin: getDirs(
                  (isInline[0] ? Math.floor(context.pad) : 0) - 1,
                  (isInline[isInline.length - 1] ? Math.ceil(context.pad) : 0) -
                    1,
                ),
              })}
              >${repeat<any>(
                children,
                (_, i) => i,
                ({ type, node }, i) =>
                  type === 'inline'
                    ? node
                    : html`
                        <div style=${styleMap({ padding: '1px 0' })}>
                          <div
                            style=${styleMap({
                              margin: getDirs(
                                (isInline[i - 1]
                                  ? Math.floor(context.pad)
                                  : 0) - 1,
                                (isInline[i + 1] ? Math.ceil(context.pad) : 0) -
                                  1,
                              ),
                            })}
                          >
                            ${type === 'box' ? node() : node}
                          </div>
                        </div>
                      `,
              )}</div
            >
          `,
          'box',
        ),
    };
  });
  dispose() {
    if (this.observer) this.observer.disconnect();
    this.observer = false;
  }
}

export default node => {
  const root = new Node();
  const context = {};
  return data => {
    if (data) render(root.update(data, context).node, node);
    else root.dispose();
  };
};
