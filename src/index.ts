import updateChildren from './children';
import boxComponents from './components';
import parse from './parse';
import { createTextNode, getValues, unpackList } from './utils';

export { findChild, getSetters, getValues, parseValue } from './utils';

const getComponentNode = (node, component, args) => {
  if (node && component === node.__component) return node;
  if (node && node.__destroy) node.__destroy();
  if (!component) {
    const value = args[0];
    if (!value) return null;
    const result = createTextNode(value) as any;
    result.__component = null;
    result.__update = value => {
      result.nodeValue = value;
    };
    return result;
  }
  const result = component();
  result.node.__component = component;
  result.node.__update = result.update;
  result.node.__destroy = result.destroy;
  const boxComp = Object.keys(boxComponents).find(
    k => boxComponents[k] === component,
  );
  if (boxComp) result.node.dataset.component = boxComp;
  return result.node;
};

const updateComponent = (node, component, args) => {
  const result = getComponentNode(node, component, args);
  if (result) result.__update(...args);
  return result;
};

const getBoxComp = ({ flow, cols, gap, image, input }, { next }) => {
  if (flow) return 'text';
  if (image) return 'image';
  if (input) return 'input';
  if (cols.rows) return 'table';
  if (gap || cols.cols) return 'cols';
  if (next === 'row') return 'row';
  return 'box';
};

const createUpdater = (components = {}) => {
  const getComp = (data, context) => {
    if (data.type === 'value') return [null, data.value];
    const { values, indices } = unpackList(data.value);
    const tag = getValues(values, { '': 'string' })[''];
    if (tag) {
      if (!components[tag]) return [null, ''];
      return [components[tag], values, indices, updateNode(context)];
    }
    const parsed = parse(values, indices, context);
    const boxComp = getBoxComp(parsed.info, context);
    return [
      boxComponents[boxComp],
      parsed.info,
      indices,
      updateNode({ ...parsed.context, parentComp: boxComp }),
    ];
  };

  const updateNode = context => (node, data) => {
    const [comp, ...args] = getComp(data, context);
    const runUpdate = n => {
      if (comp === null && context.parentComp !== 'box') {
        return updateComponent(node, boxComponents.box, [
          parse({}, [], context).info,
          [{ type: 'value', value: '' }],
          n => updateComponent(n, comp, args),
        ]);
      }
      return updateComponent(n, comp, args);
    };
    if (context.next) {
      if (comp !== boxComponents[context.next]) {
        return updateComponent(node, boxComponents[context.next], [
          parse({}, [], context).info,
          [{ type: 'value', value: '' }],
          runUpdate,
        ]);
      }
    }
    return runUpdate(node);
  };

  return updateNode({});
};

export default (components, node) => {
  let stop;
  return data => {
    if (data) {
      const child = node.childNodes[0];
      const scroll = child && child.scrollY;
      stop = updateChildren(
        node,
        !data.value ? [] : [data],
        createUpdater(components),
      );
      if (child) child.scrollTo(0, scroll);
    } else if (stop) {
      stop();
    }
  };
};
