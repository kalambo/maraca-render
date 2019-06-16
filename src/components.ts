import { fromJs } from 'maraca';
import * as erd from 'element-resize-detector';
import * as throttle from 'lodash.throttle';

import updateChildren from './children';
import { padNode, padText } from './pad';
import {
  applyObj,
  cleanObj,
  createNodes,
  diffObjs,
  findChild,
  getChildren,
  mergeObjs,
  toPx,
  wrapMethods,
} from './utils';

const resizeDetector = erd({ strategy: 'scroll' });

const createSizer = () => {
  let info = {} as any;
  let resize;
  return (node, next) => {
    info = { ...info, ...next };
    const newResize =
      (info.setWidth || info.setHeight) &&
      ((width, height) => {
        if (info.setWidth) info.setWidth(fromJs(width));
        if (info.setHeight) info.setHeight(fromJs(height));
      });
    const changed = !resize !== !newResize;
    resize = newResize;
    if (changed) {
      if (resize) {
        resizeDetector.listenTo(
          node,
          throttle(() => resize(node.offsetWidth, node.offsetHeight), 50),
        );
      } else {
        resizeDetector.removeAllListeners(node);
      }
    }
    return info;
  };
};

const createUpdater = () => {
  const wrap = wrapMethods();
  let prev;
  return (node, ...props) => {
    const cleaned = wrap(cleanObj(mergeObjs(props)));
    applyObj(node, diffObjs(cleaned, prev));
    prev = cleaned;
  };
};

export default {
  text: () => {
    const [node] = createNodes('span');
    const updater = createUpdater();
    let destroy;
    return {
      node,
      update: (info, indices, next) => {
        destroy = updateChildren(node, indices, next);
        updater(node, info.text.props, info.box.props);
      },
      destroy: () => destroy && destroy(),
    };
  },
  image: () => {
    const [node] = createNodes('img');
    const sizer = createSizer();
    const updater = createUpdater();
    return {
      node,
      update: info => {
        const size = sizer(node, info.size);
        updater(node, info.box.props, {
          src: info.image,
          style: {
            width: '100%',
            maxWidth: size.width,
            height: size.height,
            marginLeft: size.xAlign !== 'left' ? 'auto' : '',
            marginRight: size.xAlign !== 'right' ? 'auto' : '',
          },
        });
      },
    };
  },
  input: () => {
    const [node, middle, inner] = createNodes('div', 'div', 'input');
    const innerUpdater = createUpdater();
    const nodeUpdater = createUpdater();
    return {
      node,
      update: info => {
        innerUpdater(inner, { type: 'text' }, info.text.props, info.input);
        nodeUpdater(node, info.box.props);
        if (info.focus) setTimeout(() => inner.focus());
        padText(middle, info.text.pad);
        padNode(middle, 'pad', info.box.pad);
      },
    };
  },
  box: () => {
    const [node, inner] = createNodes('div', 'div');
    const sizer = createSizer();
    const innerUpdater = createUpdater();
    const nodeUpdater = createUpdater();
    let destroy;
    return {
      node,
      update: (info, indices, next) => {
        destroy = updateChildren(inner, indices, next, 2);
        getChildren(inner).forEach(n => {
          const c = findChild(n, 2);
          c.parentNode.style.display =
            c.nodeType === 3 || c.tagName === 'SPAN' ? 'inline' : 'block';
          c.parentNode.parentNode.style.display =
            c.nodeType === 3 || c.tagName === 'SPAN' ? 'inline' : 'block';
        });
        innerUpdater(inner, info.text.props);
        padText(inner, info.text.pad);
        padNode(inner, 'pad', info.box.pad);
        const size = sizer(node, info.size);
        nodeUpdater(node, info.box.props, {
          style: {
            width: ['left', 'right'].includes(size.xAlign) ? 'auto' : '100%',
            maxWidth: size.width,
            height: size.height,
            float:
              size.xAlign === 'left' || size.xAlign === 'right'
                ? size.xAlign
                : 'none',
            marginLeft: size.xAlign !== 'left' ? 'auto' : '',
            marginRight: size.xAlign !== 'right' ? 'auto' : '',
          },
        });
        node.__info = {
          fill: info.box.props.style.background,
          width: size.width,
          yAlign: size.yAlign,
        };
      },
      destroy: () => destroy && destroy(),
    };
  },
  cols: () => {
    const [node] = createNodes('div');
    const sizer = createSizer();
    const updater = createUpdater();
    let destroy;
    return {
      node,
      update: (info, indices, next) => {
        destroy = updateChildren(node, indices, next, 2, info.cols.cols, true);
        const size = sizer(node, info.size);
        updater(node, info.text.props, info.box.props, {
          style: {
            display: 'table',
            tableLayout: 'fixed',
            padding: toPx(info.box.pad),
            width: ['left', 'right'].includes(size.xAlign) ? 'auto' : '100%',
            maxWidth: size.width,
            height: size.height,
            float:
              size.xAlign === 'left' || size.xAlign === 'right'
                ? size.xAlign
                : 'none',
            marginLeft: size.xAlign !== 'left' ? 'auto' : '',
            marginRight: size.xAlign !== 'right' ? 'auto' : '',
          },
        });
        node.__info = {
          fill: info.box.props.style.background,
          width: size.width,
          yAlign: size.yAlign,
        };
        const gap = info.gap || ['0', '0'];
        getChildren(node).forEach((row, i) => {
          applyObj(row, {
            style: {
              display: 'table-row',
              ...(i % 2 === 1 ? { height: toPx(gap[0]) } : {}),
            },
          });
          getChildren(row).forEach((cell, j) => {
            const child = getChildren(cell)[0];
            applyObj(cell, {
              style: {
                display: 'table-cell',
                background:
                  (child && child.__info && child.__info.fill) || 'none',
                width: (child && child.__info && child.__info.width) || 'auto',
                verticalAlign:
                  (child && child.__info && child.__info.yAlign) || 'top',
                ...(j % 2 === 1 ? { width: toPx(gap[1]) } : {}),
              },
            });
          });
        });
      },
      destroy: () => destroy && destroy(),
    };
  },
  row: () => {
    const [node] = createNodes('div');
    const updater = createUpdater();
    let destroy;
    return {
      node,
      update: (info, indices, next) => {
        destroy = updateChildren(node, indices, next, 0, 0, true);
        updater(node, info.text.props, info.box.props, {
          style: { display: 'table-row' },
        });
        const gap = info.gap || ['0', '0'];
        getChildren(node).forEach((cell, j) => {
          const child = getChildren(cell)[0];
          applyObj(cell, {
            style: {
              display: 'table-cell',
              background:
                (child && child.__info && child.__info.fill) || 'none',
              width: (child && child.__info && child.__info.width) || 'auto',
              verticalAlign:
                (child && child.__info && child.__info.yAlign) || 'top',
              ...(j % 2 === 1 ? { width: toPx(gap[1]) } : {}),
            },
          });
        });
      },
      destroy: () => destroy && destroy(),
    };
  },
  table: () => {
    const [node] = createNodes('div');
    const sizer = createSizer();
    const updater = createUpdater();
    let destroy;
    return {
      node,
      update: (info, indices, next) => {
        destroy = updateChildren(node, indices, next, 0, 0, true);
        const size = sizer(node, info.size);
        updater(node, info.text.props, info.box.props, {
          style: {
            display: 'table',
            tableLayout: 'fixed',
            padding: toPx(info.box.pad),
            width: ['left', 'right'].includes(size.xAlign) ? 'auto' : '100%',
            maxWidth: size.width,
            height: size.height,
            float:
              size.xAlign === 'left' || size.xAlign === 'right'
                ? size.xAlign
                : 'none',
            marginLeft: size.xAlign !== 'left' ? 'auto' : '',
            marginRight: size.xAlign !== 'right' ? 'auto' : '',
          },
        });
        node.__info = {
          fill: info.box.props.style.background,
          width: size.width,
          yAlign: size.yAlign,
        };
        const gap = info.gap || ['0', '0'];
        getChildren(node).forEach((row, i) => {
          applyObj(row, {
            style: {
              display: 'table-row',
              ...(i % 2 === 1 ? { height: toPx(gap[0]) } : {}),
            },
          });
        });
      },
      destroy: () => destroy && destroy(),
    };
  },
};
