//   const inTable = ['cols', 'row', 'table'].includes(context.parentComp);
//   const tableInfo = inTable
//     ? { width: size.width, yAlign: size.yAlign, fill, round }
//     : null;

//       table: tableInfo,
//     context: {
//       next: cols.rows ? 'row' : null,
//       wrap: cols.cols === 1,
//     },
//   };
// };

// export default {

//   row: () => {
//     const [node] = createNodes('div');
//     const updater = createUpdater();
//     let destroy;
//     return {
//       node,
//       update: (info, indices, next) => {
//         destroy = updateChildren(node, indices, next, 0, 0, true);
//         updater(node, info.text.props, info.box.props, {
//           style: { display: 'table-row' },
//         });
//         const gap = info.gap || ['0', '0'];
//         getChildren(node).forEach((cell, j) => {
//           const child = getChildren(cell)[0];
//           applyObj(cell, {
//             style: {
//               display: 'table-cell',
//               background:
//                 (child && child.__info && child.__info.fill) || 'none',
//               borderRadius:
//                 (child && child.__info && child.__info.round) || 'none',
//               width: (child && child.__info && child.__info.width) || 'auto',
//               verticalAlign:
//                 (child && child.__info && child.__info.yAlign) || 'top',
//               ...(j % 2 === 1 ? { width: toPx(gap[1]) } : {}),
//             },
//           });
//         });
//       },
//       destroy: () => destroy && destroy(),
//     };
//   },
//   table: () => {
//     const [node] = createNodes('div');
//     const sizer = createSizer();
//     const updater = createUpdater();
//     let destroy;
//     return {
//       node,
//       update: (info, indices, next) => {
//         destroy = updateChildren(node, indices, next, 0, 0, true);
//         const size = sizer(node, info.size);
//         if (info.table) {
//           info.table.width = size.width;
//           info.table.yAlign = size.yAlign;
//           if (size.width && size.width.endsWith('%')) delete size.width;
//         }
//         updater(node, info.text.props, info.box.props, {
//           style: {
//             display: 'table',
//             tableLayout: info.gap ? 'fixed' : 'auto',
//             padding: toPx(info.box.pad),
//             width: ['left', 'right'].includes(size.xAlign) ? 'auto' : '100%',
//             maxWidth: size.width,
//             height: size.height,
//             float:
//               size.xAlign === 'left' || size.xAlign === 'right'
//                 ? size.xAlign
//                 : 'none',
//             marginLeft: size.xAlign !== 'left' ? 'auto' : '',
//             marginRight: size.xAlign !== 'right' ? 'auto' : '',
//           },
//         });
//         node.__info = info.table || {};
//         const gap = info.gap || ['0', '0'];
//         getChildren(node).forEach((row, i) => {
//           applyObj(row, {
//             style: {
//               display: 'table-row',
//               ...(i % 2 === 1 ? { height: toPx(gap[0]) } : {}),
//             },
//           });
//         });
//       },
//       destroy: () => destroy && destroy(),
//     };
//   },
// };

// import updateChildren from './children';
// import boxComponents from './components';
// import parse from './parse';
// import { createTextNode, getValues, unpackList } from './utils';

// export { padNode, padText } from './pad';
// export { createNodes, createUpdater, parseValue } from './utils';

// const getComponentNode = (node, component, args) => {
//   if (node && component === node.__component) return node;
//   if (node && node.__destroy) node.__destroy();
//   if (!component) {
//     const value = args[0];
//     if (!value) return null;
//     const result = createTextNode(value) as any;
//     result.__component = null;
//     result.__update = value => {
//       result.nodeValue = value;
//     };
//     return result;
//   }
//   const result = component();
//   result.node.__component = component;
//   result.node.__update = result.update;
//   result.node.__destroy = result.destroy;
//   const boxComp = Object.keys(boxComponents).find(
//     k => boxComponents[k] === component,
//   );
//   if (boxComp) result.node.dataset.component = boxComp;
//   return result.node;
// };

// const updateComponent = (node, component, args) => {
//   const result = getComponentNode(node, component, args);
//   if (result) result.__update(...args);
//   return result;
// };

// const getBoxComp = ({ flow, cols, gap, image, input }, { next }) => {
//   if (flow) return 'text';
//   if (image) return 'image';
//   if (input) return 'input';
//   if (cols.rows) return 'table';
//   if (gap || cols.cols) return 'cols';
//   if (next === 'row') return 'row';
//   return 'box';
// };

// const createUpdater = components => {
//   const getComp = (data, context) => {
//     if (data.type === 'value') return [null, data.value];
//     const { values, indices } = unpackList(data.value);
//     const parsed = parse(values, indices, context);
//     const tag = getValues(values, { '': 'string' })[''];
//     if (tag && components[tag]) {
//       return [components[tag], values, indices, parsed, updateNode(context)];
//     }
//     const boxComp = getBoxComp(parsed.info, context);
//     return [
//       boxComponents[boxComp],
//       parsed.info,
//       indices,
//       updateNode({ ...parsed.context, parentComp: boxComp }),
//     ];
//   };

//   const updateNode = context => (node, data) => {
//     if (node && node.__data === data) return node;
//     const [comp, ...args] = getComp(data, context);
//     const runUpdate = n => {
//       if (
//         (comp === null && !['text', 'box'].includes(context.parentComp)) ||
//         (comp === 'text' && context.parentComp !== 'box')
//       ) {
//         return updateComponent(node, boxComponents.box, [
//           parse({}, [], context).info,
//           [{ type: 'value', value: '' }],
//           n => updateComponent(n, comp, args),
//         ]);
//       }
//       return updateComponent(n, comp, args);
//     };
//     if (context.next) {
//       if (comp !== boxComponents[context.next]) {
//         const result = updateComponent(node, boxComponents[context.next], [
//           parse({}, [], context).info,
//           [{ type: 'value', value: '' }],
//           runUpdate,
//         ]);
//         result.__data = data;
//         return result;
//       }
//     }
//     const result = runUpdate(node);
//     if (result) result.__data = data;
//     return result;
//   };

//   return updateNode({});
// };

// export default (node, components = {}) => {
//   let stop;
//   const updater = createUpdater(components);
//   return data => {
//     if (data) {
//       stop = updateChildren(node, !data.value ? [] : [data], updater);
//     } else if (stop) {
//       stop();
//     }
//   };
// };
