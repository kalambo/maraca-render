import { update } from './utils';

export { default as box } from './box';
export { dom } from './utils';

export default (render, node) => data => {
  update.children(
    node,
    [{ type: 'list', value: { indices: [data], values: {} } }],
    render,
  );
};
