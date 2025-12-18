export const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

export const roundToStep = (value: number, step: number): number => {
  if (step === 0) return value;
  const rounded = Math.round(value / step) * step;
  const precision = step < 1 ? step.toString().split(".")[1]?.length ?? 0 : 0;
  return Number(rounded.toFixed(precision));
};
