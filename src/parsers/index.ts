import { isInteger, isNumber, split, toNumber } from '../utils';

import color from './color';

export default {
  color,
  dirs: (s = '') => {
    const parts = split(s);
    if (parts.length === 0) return null;
    return [
      parts[0] || 0,
      parts[3] || parts[1] || parts[0] || 0,
      parts[2] || parts[0] || 0,
      parts[1] || parts[0] || 0,
    ].map(toNumber);
  },
  cols: (s = '', childCount) => {
    const result = {} as any;
    split(s).forEach(p => {
      if (p === 'all') result.cols = childCount;
      else if (p === 'equal') result.equal = true;
      else if (isInteger(p)) result.cols = toNumber(p);
    });
    if (result.equal) result.cols = result.cols || childCount;
    return result.cols ? result : {};
  },
  width: (s = '') => {
    const result = {} as any;
    split(s).forEach(p => {
      if (['left', 'center', 'right'].includes(p)) {
        result.hAlign = p;
      } else if (isNumber(p)) {
        const n = parseFloat(p);
        if (n <= 1) result.width = `${n * 100}%`;
        else result.width = `${n}px`;
      }
    });
    if (result.width) result.hAlign = result.hAlign || 'center';
    return result;
  },
  height: (s = '') => {
    const result = {} as any;
    split(s).forEach(p => {
      if (['top', 'center', 'bottom'].includes(p)) {
        result.vAlign = p === 'center' ? 'middle' : p;
      } else if (isNumber(p)) {
        const n = parseFloat(p);
        if (n <= 1) result.height = `${n * 100}%`;
        else result.height = `${n}px`;
      }
    });
    if (result.height) result.vAlign = result.vAlign || 'center';
    return result;
  },
  style: (s = '') => {
    const result = {} as any;
    const parts = split(s).filter(p => {
      if (isNumber(p)) {
        const n = toNumber(p);
        if (n <= 3) result.lineHeight = n;
        else result.fontSize = n;
      } else if (p === 'normal') {
        result.fontWeight = 'normal';
        result.fontStyle = 'normal';
      } else if (p === 'bold') {
        result.fontWeight = 'bold';
      } else if (p === 'italic') {
        result.fontStyle = 'italic';
      } else if (p === 'exact') {
        result.whiteSpace = 'pre';
      } else if (p === 'bullet') {
        result.display = 'list-item';
        result.listStylePosition = 'inside';
      } else if (p === 'password') {
        result.password = true;
      } else if (['center', 'left', 'right'].includes(p)) {
        result.textAlign = p;
      } else {
        return true;
      }
    });
    if (parts.length > 0) result.fontFamily = parts.join(' ');
    return result;
  },
};
