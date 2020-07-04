import { toJs } from 'maraca';

const renderToString = (data) => {
  if (data.type === 'value') return data.value;
  if (toJs(data, { portal: 'string' }).portal) return '';
  const { '': tag = 'div', style = {}, ...props } = toJs(data, {
    '': 'string',
    style: { '*': 'string' },
    '*': 'string',
  });
  const css = Object.keys(style)
    .sort()
    .map((k) => `${k}: ${style[k]}`)
    .join('; ');
  if (css) props.style = css;
  const attrs = Object.keys(props)
    .sort()
    .map((k) => `${k}="${props[k]}"`)
    .join(' ');
  const content =
    props.innerHTML ||
    data.value.indices.map((d) => renderToString(d)).join('<!---->');
  return `<${tag}${attrs && ' '}${attrs}>${content}</${tag}>`;
};

export default renderToString;
