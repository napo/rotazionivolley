import { describe, expect, it, vi } from 'vitest';
import { checkForUpdate, compareVersions } from './updates';

describe('compareVersions', () => {
  it('orders dotted versions numerically, not lexically', () => {
    expect(compareVersions('2.10.0', '2.2.0')).toBeGreaterThan(0);
  });

  it('ignores a leading "v"', () => {
    expect(compareVersions('v2.1.0', '2.1.0')).toBe(0);
  });

  it('treats a missing component as zero', () => {
    expect(compareVersions('2.1', '2.1.0')).toBe(0);
    expect(compareVersions('2.1.1', '2.1')).toBeGreaterThan(0);
  });

  it('is negative when the first version is older', () => {
    expect(compareVersions('2.0.1', '2.1.0')).toBeLessThan(0);
  });
});

describe('checkForUpdate', () => {
  // Neither Tauri's `window.isTauri` nor Capacitor's native bridge is
  // present under vitest/jsdom, so nativePlatform() is null here — exactly
  // like the real web build, which is the one case checkForUpdate must
  // short-circuit without ever calling fetch.
  it('never calls GitHub on the (simulated) web build', async () => {
    const fetchImpl = vi.fn();
    const result = await checkForUpdate('2.1.0', fetchImpl);
    expect(result).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
