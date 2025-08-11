import { describe, it, expect } from 'vitest';

function velocity(interactions: number, minutes: number) {
  return interactions / Math.max(minutes, 1);
}

function median(values: number[]) {
  const arr = [...values].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

describe('metrics math', () => {
  it('computes velocity', () => {
    expect(velocity(100, 50)).toBe(2);
    expect(velocity(0, 10)).toBe(0);
    expect(velocity(10, 0)).toBe(10);
  });

  it('computes median', () => {
    expect(median([1, 3, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});