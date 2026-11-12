import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type GateModule = typeof import('./mockGate');
type ClientModule = typeof import('./apiClient');

async function load(): Promise<{
  gate: GateModule;
  client: ClientModule;
}> {
  vi.resetModules();
  vi.unstubAllGlobals();
  const client = await import('./apiClient');
  client.__resetConfigForTests();
  const gate = await import('./mockGate');
  return { gate, client };
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('runWithMock (SPEC §2.3)', () => {
  it('ejecuta real y devuelve su resultado cuando no hay mock', async () => {
    const { gate } = await load();
    const result = await gate.runWithMock(
      async () => 'real',
      () => 'mock'
    );
    expect(result).toBe('real');
  });

  it('propaga errores reales (sin fallback silencioso)', async () => {
    const { gate } = await load();
    await expect(
      gate.runWithMock(
        async () => {
          throw new Error('API down');
        },
        () => 'mock'
      )
    ).rejects.toThrow('API down');
  });

  it('usa mock si el cliente lanza MOCK_FALLBACK_TRIGGERED', async () => {
    const { gate } = await load();
    const result = await gate.runWithMock(
      async () => {
        throw new Error('MOCK_FALLBACK_TRIGGERED');
      },
      () => 'mock'
    );
    expect(result).toBe('mock');
  });

  it('usa mock directo cuando forceMockMode está activo', async () => {
    const { gate, client } = await load();
    client.setForceMockMode(true);
    const realSpy = vi.fn(async () => 'real');
    const result = await gate.runWithMock(realSpy, () => 'mock');
    expect(result).toBe('mock');
    expect(realSpy).not.toHaveBeenCalled();
  });

  it('isMockFallbackTriggered detecta solo ese mensaje', async () => {
    const { gate } = await load();
    expect(gate.isMockFallbackTriggered(new Error('MOCK_FALLBACK_TRIGGERED'))).toBe(true);
    expect(gate.isMockFallbackTriggered(new Error('other'))).toBe(false);
    expect(gate.isMockFallbackTriggered('string')).toBe(false);
  });
});
