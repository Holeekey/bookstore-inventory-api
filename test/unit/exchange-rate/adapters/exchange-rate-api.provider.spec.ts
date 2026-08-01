import { ExchangeRateApiProvider } from 'src/exchange-rate/adapters/exchange-rate-api.provider'

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response
}

describe('ExchangeRateApiProvider', () => {
  let provider: ExchangeRateApiProvider
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn()
    global.fetch = fetchMock
    provider = new ExchangeRateApiProvider()
  })

  it('returns the rate for the requested currency from the live API', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ base: 'USD', rates: { VES: 748.79 } }),
    )

    const result = await provider.getRate('VES')

    expect(result).toEqual({ currency: 'VES', rate: 748.79 })
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

  it('falls back to the default rate when the currency is missing from the response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ base: 'USD', rates: {} }))

    const result = await provider.getRate('VES')

    expect(result.currency).toBe('VES')
    expect(result.rate).toBeGreaterThan(0)
  })
})
