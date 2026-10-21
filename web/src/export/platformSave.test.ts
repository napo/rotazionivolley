import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveFile } from './platformSave';

function onIphone(share: (data: ShareData) => Promise<void>) {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)');
  Object.assign(navigator, { canShare: () => true, share: vi.fn(share) });
}

function domError(name: string) {
  return Object.assign(new Error(name), { name });
}

describe('saveFile on iPhone/iPad (web build)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'canShare');
    Reflect.deleteProperty(navigator, 'share');
  });

  const blob = new Blob(['x'], { type: 'image/png' });

  it('opens the share sheet with the named file', async () => {
    onIphone(() => Promise.resolve());
    await expect(saveFile(blob, 'schema.png')).resolves.toEqual({ kind: 'shared' });
    const [data] = vi.mocked(navigator.share).mock.calls[0];
    expect(data?.files?.[0].name).toBe('schema.png');
  });

  it('reports a dismissed share sheet as cancelled', async () => {
    onIphone(() => Promise.reject(domError('AbortError')));
    await expect(saveFile(blob, 'schema.png')).resolves.toEqual({ kind: 'cancelled' });
  });

  it('asks for a new tap when the original one has expired', async () => {
    let calls = 0;
    onIphone(() => (++calls === 1 ? Promise.reject(domError('NotAllowedError')) : Promise.resolve()));
    const outcome = await saveFile(blob, 'sequenza.pdf');
    expect(outcome.kind).toBe('shareReady');
    if (outcome.kind !== 'shareReady') return;
    await expect(outcome.share()).resolves.toEqual({ kind: 'shared' });
  });
});
