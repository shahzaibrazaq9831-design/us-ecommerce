const EPSILON = 1e-9;

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round((value + EPSILON) * 100) / 100;
}

export function assertNonNegative(amount: number, label: string): void {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError(`${label} must be a non-negative finite number`);
  }
}

export function assertPositive(amount: number, label: string): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new RangeError(`${label} must be a positive finite number`);
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
