import * as Chart from 'chart.js';

import getColor from './color';
import { extract, getValue, split, toNumber } from './utils';

export default (node, { chartType, labels }, indices) => {
  const datasets = indices
    .filter(d => d.type === 'list')
    .map(d => ({
      values: extract(d.value.values).values,
      indices: d.value.indices.map(getValue).map(toNumber),
    }))
    .map(({ values: { label, color, border }, indices }) => {
      const [borderWidth, ...borderColor] = split(
        typeof border === 'string' && border,
      );
      return {
        label,
        backgroundColor: getColor(typeof color === 'string' && color),
        borderColor: getColor(borderColor.join(' ')),
        borderWidth: toNumber(borderWidth),
        data: indices,
      };
    });
  if (node.__chart) node.__chart.destroy();
  node.__chart = new Chart(node, {
    type: chartType,
    data: { labels, datasets },
    options: { animation: false },
  });
  return () => node.__chart.destroy();
};
