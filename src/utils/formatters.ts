export const formatUSDT = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return '0.00';
  const str = val.toString();
  if (str.includes('.') && str.split('.')[1].length > 2) {
    return val.toFixed(3);
  }
  return val.toFixed(2);
};
