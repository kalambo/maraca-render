import { fromJs } from 'maraca';
import * as erd from 'element-resize-detector';
import * as throttle from 'lodash.throttle';

const resizeDetector = erd({ strategy: 'scroll' });

import { getValues } from '../utils';

import parsers from './parsers';

export default (node, values, context, cols) => {
  node.__size = node.__size || {};

  const parsed = getValues(values, { height: 'string', width: 'string' });
  const { height, vAlign } = parsers.height(parsed.height);
  const { width, hAlign } = parsers.width(parsed.width);
  const size = { height, vAlign, width: context.width || width, hAlign };
  if (values.height && values.height.wasSet) {
    size.height = node.__size.height;
    size.vAlign = node.__size.vAlign;
  }
  if (values.width && values.width.wasSet) {
    size.width = node.__size.width;
    size.hAlign = node.__size.hAlign;
  }

  const prevSet = !!(node.__size.setHeight || node.__size.setWidth);
  const setHeight = values.height && values.height.set;
  const setWidth = values.width && values.width.set;
  const nextSet = !!(setHeight || setWidth);
  if (nextSet !== prevSet) {
    if (nextSet) {
      resizeDetector.listenTo(
        node,
        throttle(() => {
          if (node.__size.setHeight) {
            node.__size.setHeight(fromJs(node.offsetHeight));
          }
          if (node.__size.setWidth) {
            node.__size.setWidth(fromJs(node.offsetWidth));
          }
        }, 50),
      );
    } else {
      resizeDetector.removeAllListeners(node);
    }
  }

  node.__size = { ...size, setHeight, setWidth };

  return {
    vAlign: size.vAlign || 'top',
    props: {
      style: {
        height: size.height ? `${size.height}px` : '',
        maxWidth: size.width,
        width: cols
          ? !size.width && size.hAlign
            ? 'auto'
            : '100%'
          : context.colsParent
          ? size.width
          : '100%',
        display: cols || size.hAlign ? 'table' : 'block',
        marginLeft: size.hAlign !== 'left' ? 'auto' : '',
        marginRight: size.hAlign !== 'right' ? 'auto' : '',
      },
    },
  };
};
