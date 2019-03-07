import box from './box';
import { update } from './utils';

export { updateBox } from './box';
export {
  createNode,
  findChild,
  getSetters,
  getValues,
  html,
  parseValue,
} from './utils';

export default (components, node) => data => {
  const child = node.childNodes[0];
  const scroll = child && child.scrollY;
  update.children(node, !data.value ? [] : [data], box(components));
  if (child) child.scrollTo(0, scroll);
};
