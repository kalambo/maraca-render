import { split, toNumber } from '../utils';

export default s => {
  const parts = split(s);
  if (parts.length === 0) return null;
  return [
    parts[0] || 0,
    parts[3] || parts[1] || parts[0] || 0,
    parts[2] || parts[0] || 0,
    parts[1] || parts[0] || 0,
  ].map(toNumber);
};
