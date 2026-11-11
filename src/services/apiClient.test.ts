import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type ClientModule = typeof import('./apiClient');

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

let client: ClientModule;

async function freshClient(): Promise<ClientModule> {
  vi.resetModules();
  vi.unstubAllGlobals();
  const mod = await import('./apiClient');
  mod.__resetConfigForTests();
  return mod;
}

beforeEach(async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  client = await freshClient();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('apiClient — construcción de URL (SPEC §2.3)', () => {
  it('usa /api/v1 por defecto', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ status: 'ok' }));
    vi.stubGlobal('fetch', fetchMock);

    await client.request('/health');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0] as unknown as [string];
    expect(url).toBe('/api/v1/health');
  });

  it('respeta VITE_API_BASE_URL via config', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ items: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);
    client.__setConfigForTests({ baseUrl: 'https://api.example.com/api/v1' });

    await client.request('/products');

    const [url] = fetchMock.mock.calls[0] as unknown as [string];
    expect(url).toBe('https://api.example.com/api/v1/products');
  });

  it('expone el default documentado en API_BASE_URL', () => {
    expect(client.API_BASE_URL).toBe('/api/v1');
  });
});

describe('apiClient — errores HTTP (FastAPI detail)', () => {
  it('404 con {detail} se convierte en PriceScopeApiException', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ detail: 'producto 9 no encontrado' }, 404))
    );

    const error: any = await client.request('/products/9').catch((e: any) => e);

    expect(error).toBeInstanceOf(client.PriceScopeApiException);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('producto 9 no encontrado');
  });

  it('422 de validación propaga detail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ detail: [{ msg: 'invalid' }] }, 422))
    );

    const error: any = await client
      .request('/products', { method: 'POST' })
      .catch((e: any) => e);

    expect(error.statusCode).toBe(422);
    expect(error.detail).toBeDefined();
  });
});

describe('apiClient — semántica de mock (SPEC §2.3: sin fallback silencioso)', () => {
  it('mock habilitado corta antes de fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    client.__setConfigForTests({ mock: true });

    await expect(client.request('/health')).rejects.toThrow(
      'MOCK_FALLBACK_TRIGGERED'
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(client.getIsMockMode()).toBe(true);
  });

  it('mock deshabilitado: error de red se propaga (NO mock)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('network down');
      })
    );
    client.__setConfigForTests({ mock: false });

    const error: any = await client.request('/health').catch((e: any) => e);

    expect(error).toBeInstanceOf(TypeError);
    expect(error.message).toBe('network down');
    expect(client.getIsMockMode()).toBe(false);
  });

  it('mock habilitado + error de red => fallback a mock', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('network down');
      })
    );
    client.__setConfigForTests({ mock: true });
    // el usuario forzo live en dev, pero el backend esta caido
    client.setForceMockMode(false);

    const error: any = await client.request('/health').catch((e: any) => e);
    expect(error.message).toBe('MOCK_FALLBACK_TRIGGERED');
    expect(client.getIsMockMode()).toBe(true);
  });

  it('HTTP 500 siempre propaga la excepción (nunca mock)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ detail: 'boom' }, 500))
    );

    const error: any = await client.request('/health').catch((e: any) => e);
    expect(error).toBeInstanceOf(client.PriceScopeApiException);
    expect(error.statusCode).toBe(500);
  });

  it('suscripción notifica cambios de modo', () => {
    const listener = vi.fn();
    const unsubscribe = client.subscribeMockMode(listener);

    client.setForceMockMode(true);
    expect(listener).toHaveBeenCalledWith(true);
    client.setForceMockMode(false);
    expect(listener).toHaveBeenCalledWith(false);

    unsubscribe();
    client.setForceMockMode(true);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
