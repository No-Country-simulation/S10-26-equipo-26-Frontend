import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type HealthModule = typeof import('./healthService');
type ClientModule = typeof import('./apiClient');

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function load(
  fetchImpl?: () => Promise<Response>
): Promise<{
  health: HealthModule;
  client: ClientModule;
  fetchMock: ReturnType<typeof vi.fn>;
}> {
  vi.resetModules();
  vi.unstubAllGlobals();
  const fetchMock = vi.fn(
    fetchImpl ??
      (async () =>
        jsonResponse({ status: 'ok', app: 'PriceScope API', version: '0.1.0' }))
  );
  vi.stubGlobal('fetch', fetchMock);
  const client = await import('./apiClient');
  client.__setConfigForTests({ mock: false });
  const health = await import('./healthService');
  return { health, client, fetchMock };
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('healthService — GET /api/v1/health (HU 0.4)', () => {
  it('consulta la ruta del contrato y devuelve {status, app, version}', async () => {
    const { health, fetchMock } = await load();

    const result = await health.getHealth();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe('/api/v1/health');
    expect(new Headers(init.headers).get('Accept')).toBe('application/json');

    expect(result.status).toBe('ok');
    expect(result.app).toBe('PriceScope API');
    expect(result.version).toBe('0.1.0');
  });

  it('isBackendHealthy devuelve true cuando status=ok', async () => {
    const { health } = await load();
    expect(await health.isBackendHealthy()).toBe(true);
  });

  it('isBackendHealthy devuelve false si el backend responde 500', async () => {
    const { health } = await load(async () =>
      jsonResponse({ detail: 'boom' }, 500)
    );

    expect(await health.isBackendHealthy()).toBe(false);
  });

  it('isBackendHealthy devuelve false si no hay red', async () => {
    const { health } = await load(async () => {
      throw new TypeError('network down');
    });

    expect(await health.isBackendHealthy()).toBe(false);
  });

  it('getHealth propaga PriceScopeApiException ante 404', async () => {
    const { health, client } = await load(async () =>
      jsonResponse({ detail: 'Not Found' }, 404)
    );

    const error = (await health
      .getHealth()
      .catch((e: unknown) => e)) as import('./apiClient').PriceScopeApiException;
    expect(error).toBeInstanceOf(client.PriceScopeApiException);
    expect(error.statusCode).toBe(404);
  });
});
