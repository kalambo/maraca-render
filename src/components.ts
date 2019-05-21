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

const addGaps = (node, deep) => {
  getChildren(node).forEach((child, i) => {
    if (i !== 0) {
      node.insertBefore(
        applyObj(createNodes('div')[0], { __gap: true }),
        child,
      );
    }
    if (deep) addGaps(child, false);
  });
};
const updateGaps = (node, getStyle, deep) => {
  [...node.childNodes].forEach(child => {
    applyObj(child, { style: getStyle(child.__gap, false) });
    if (deep) updateGaps(child, gap => getStyle(gap, true), false);
  });
};
const removeGaps = (node, deep) => {
  [...node.childNodes].forEach(n => {
    if (n.__gap) node.removeChild(n);
    else if (deep) removeGaps(n, false);
  });
};
const createGapUpdater = (deep = false) => {
  let prev = false;
  return (node, gap, getStyle) => {
    if (prev !== !!gap) {
      if (gap) addGaps(node, deep);
      else removeGaps(node, deep);
    }
    updateGaps(node, getStyle, deep);
    prev = !!gap;
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
            width: info.parent === 'cols' ? size.width : '100%',
            maxWidth: size.width,
            height: size.height,
            marginLeft: size.xAlign !== 'left' ? 'auto' : '',
            marginRight: size.xAlign !== 'right' ? 'auto' : '',
          },
        });
      },
      destroy: () => destroy && destroy(),
    };
  },
  cols: () => {
    const [node] = createNodes('div');
    const sizer = createSizer();
    const updater = createUpdater();
    const gapUpdater = createGapUpdater(true);
    let destroy;
    return {
      node,
      update: (info, indices, next) => {
        destroy = updateChildren(node, indices, next, 0, info.cols.cols);
        const size = sizer(node, info.size);
        updater(node, info.text.props, info.box.props, {
          style: {
            display: 'table',
            tableLayout: 'fixed',
            padding: toPx(info.box.pad),
            width: !size.width && size.xAlign ? 'auto' : '100%',
            maxWidth: size.width,
            height: size.height,
            marginLeft: size.xAlign !== 'left' ? 'auto' : '',
            marginRight: size.xAlign !== 'right' ? 'auto' : '',
          },
        });
        gapUpdater(node, info.gap, (gap, deep) =>
          !deep
            ? {
                display: 'table-row',
                ...(gap ? { height: toPx(info.gap[0]) } : {}),
              }
            : {
                display: 'table-cell',
                verticalAlign: size.yAlign,
                ...(gap ? { width: toPx(info.gap[1]) } : {}),
              },
        );
      },
      destroy: () => destroy && destroy(),
    };
  },
  row: () => {
    const [node] = createNodes('div');
    const sizer = createSizer();
    const updater = createUpdater();
    const gapUpdater = createGapUpdater();
    let destroy;
    return {
      node,
      update: (info, indices, next) => {
        destroy = updateChildren(node, indices, next);
        const size = sizer(node, info.size);
        updater(node, info.text.props, info.box.props, {
          style: { display: 'table-row' },
        });
        gapUpdater(node, info.gap, gap => ({
          display: 'table-cell',
          verticalAlign: size.yAlign,
          ...(gap ? { width: toPx(info.gap[1]) } : {}),
        }));
      },
      destroy: () => destroy && destroy(),
    };
  },
  table: () => {
    const [node] = createNodes('div');
    const sizer = createSizer();
    const updater = createUpdater();
    const gapUpdater = createGapUpdater();
    let destroy;
    return {
      node,
      update: (info, indices, next) => {
        destroy = updateChildren(node, indices, next);
        const size = sizer(node, info.size);
        updater(node, info.text.props, info.box.props, {
          style: {
            display: 'table',
            tableLayout: 'fixed',
            padding: toPx(info.box.pad),
            width: !size.width && size.xAlign ? 'auto' : '100%',
            maxWidth: size.width,
            height: size.height,
            marginLeft: size.xAlign !== 'left' ? 'auto' : '',
            marginRight: size.xAlign !== 'right' ? 'auto' : '',
          },
        });
        gapUpdater(node, info.gap, gap => ({
          display: 'table-row',
          ...(gap ? { height: toPx(info.gap[0]) } : {}),
        }));
      },
      destroy: () => destroy && destroy(),
    };
  },
};
