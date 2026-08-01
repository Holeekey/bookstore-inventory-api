import { DolarApiProvider } from 'src/exchange-rate/adapters/dolar-api.provider'

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response
}

function officialDollar(overrides: Record<string, unknown> = {}) {
  return {
    moneda: 'USD',
    fuente: 'oficial',
    nombre: 'Dólar',
    compra: null,
    venta: null,
    promedio: 746.6297,
    fechaActualizacion: '2026-07-31T00:00:00-04:00',
    ...overrides,
  }
}

describe('DolarApiProvider', () => {
  let provider: DolarApiProvider
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn()
    global.fetch = fetchMock
    provider = new DolarApiProvider()
  })

  it('returns the official rate published in promedio', async () => {
    fetchMock.mockResolvedValue(jsonResponse(officialDollar()))

    const result = await provider.getRate('VES')

    expect(result).toEqual({ currency: 'VES', rate: 746.6297 })
  })

  it('falls back to venta when promedio is not published', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(officialDollar({ promedio: null, venta: 750.12 })),
    )

    const result = await provider.getRate('VES')

    expect(result).toEqual({ currency: 'VES', rate: 750.12 })
  })

  it('falls back to the default rate when the API responds with an error', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false, 500))

    const result = await provider.getRate('VES')

    expect(result.currency).toBe('VES')
    expect(result.rate).toBeGreaterThan(0)
  })

  it('falls back to the default rate when the API request fails', async () => {
    fetchMock.mockRejectedValue(new Error('network error'))

    const result = await provider.getRate('VES')

    expect(result.currency).toBe('VES')
    expect(result.rate).toBeGreaterThan(0)
  })

  it('falls back to the default rate when the response carries no usable rate', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(officialDollar({ promedio: null })),
    )

    const result = await provider.getRate('VES')

    expect(result.currency).toBe('VES')
    expect(result.rate).toBeGreaterThan(0)
  })

  it('rejects currencies the official endpoint does not publish', async () => {
    await expect(provider.getRate('EUR')).rejects.toThrow(
      'no fallback rate configured for EUR',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
