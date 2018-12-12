import { toData } from 'maraca';
import * as erd from 'element-resize-detector';
import * as throttle from 'lodash.throttle';

const resizeDetector = erd({ strategy: 'scroll' });

import parsers from '../parsers';
import { parseValues, getSetters } from '../utils';

export default (node, values, parent, cols) => {
  const parsed = parseValues({ height: 'string', width: 'string' }, values);
  const { height, vAlign } = parsers.height(parsed.height);
  const { width, hAlign } = parsers.width(parsed.width);
  const size = { height, vAlign, width: parent.width || width, hAlign };
  const setters = getSetters({ height: true, width: true }, values)[0];
  const same = {
    height: node && node.__size && node.__size.setHeight === setters.height,
    width: node && node.__size && node.__size.setWidth === setters.width,
  };
  if (setters.height && same.height) {
    size.height = node.__size.height;
    size.vAlign = node.__size.vAlign;
  }
  if (setters.width && same.width) {
    size.width = node.__size.width;
    size.hAlign = node.__size.hAlign;
  }
  const changed =
    !(
      node &&
      node.__size &&
      (node.__size.setHeight || node.__size.setWidth)
    ) !== !(setters.height || setters.width);
  node.__size = {
    ...size,
    setHeight: setters.height,
    setWidth: setters.width,
  };
  if (changed) {
    if (setters.height || setters.width) {
      resizeDetector.listenTo(
        node,
        throttle(() => {
          if (node.__size.setHeight) {
            node.__size.setHeight(toData(node.offsetHeight));
          }
          if (node.__size.setWidth) {
            node.__size.setWidth(toData(node.offsetWidth));
          }
        }, 50),
      );
    } else {
      resizeDetector.removeAllListeners(node);
    }
  }
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
          : size.width,
        display: cols || size.hAlign ? 'table' : 'block',
        marginLeft: size.hAlign !== 'left' ? 'auto' : '',
        marginRight: size.hAlign !== 'right' ? 'auto' : '',
      },
    },
  };
};
