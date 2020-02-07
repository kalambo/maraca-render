import { isInteger, parseDirs, parseValue, split, toNumber } from './utils';

export default (values, childCount) => {
  const result = {} as any;
  split(parseValue(values.cols, 'string')).forEach(p => {
    if (p === 'all') result.cols = childCount;
    else if (p === 'equal') result.equal = true;
    // else if (p === 'rows') result.rows = true;
    else if (isInteger(p)) result.cols = toNumber(p);
  });
  if (result.equal) result.cols = result.cols || childCount;
  result.gap = parseDirs(parseValue(values.gap, 'string'));
  if (result.gap) result.cols = result.cols || 1;
  if (result.cols) result.gap = result.gap || [0, 0];
  return result.rows || result.cols ? result : null;
};
