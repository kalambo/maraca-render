import { fromJs } from 'maraca';
import * as erd from 'element-resize-detector';
import * as throttle from 'lodash.throttle';

const resizeDetector = erd({ strategy: 'scroll' });

import { getSetters } from '../utils';

export default (node, values) => {
  const setters = getSetters(values, ['width', 'height']);
  const newResize =
    (setters.width || setters.height) &&
    ((width, height) => {
      if (setters.width) setters.width(fromJs(width));
      if (setters.height) setters.height(fromJs(height));
    });
  const changed = !node.__resize !== !newResize;
  node.__resize = newResize;
  if (changed) {
    if (node.__resize) {
      resizeDetector.listenTo(
        node,
        throttle(() => node.__resize(node.offsetWidth, node.offsetHeight), 50),
      );
    } else {
      resizeDetector.removeAllListeners(node);
    }
  }
};
