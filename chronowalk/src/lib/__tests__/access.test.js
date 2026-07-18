import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  isAccessTokenFormat,
  parseAccessToken,
  validateAccessToken,
} from '../access'

const rpcMock = vi.fn()

vi.mock('../supabase', () => ({
  isSupabaseConfigured: () => true,
  supabase: {
    rpc: (...args) => rpcMock(...args),
  },
}))

describe('access', () => {
  beforeEach(() => {
    rpcMock.mockReset()
  })

  it('parses token from search params', () => {
    expect(parseAccessToken('?token=abc-123')).toBe('abc-123')
    expect(parseAccessToken('')).toBe('')
  })

  it('accepts uuid and dev tokens in development', () => {
    expect(isAccessTokenFormat('not-a-token')).toBe(false)
    expect(isAccessTokenFormat('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    expect(isAccessTokenFormat('dev')).toBe(true)
  })

  it('validates dev tokens without calling Supabase', async () => {
    const result = await validateAccessToken('dev')

    expect(result).toEqual({ ok: true, source: 'dev', productId: null })
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('validates purchase tokens through get_purchase_for_token when available', async () => {
    rpcMock.mockResolvedValue({
      data: { ok: true, product_id: 'rome-essential' },
      error: null,
    })

    const token = '550e8400-e29b-41d4-a716-446655440000'
    const result = await validateAccessToken(token)

    expect(rpcMock).toHaveBeenCalledWith('get_purchase_for_token', { p_token: token })
    expect(result).toEqual({ ok: true, source: 'supabase', productId: 'rome-essential' })
  })

  it('falls back to boolean validate_access_token RPC', async () => {
    rpcMock
      .mockResolvedValueOnce({ data: null, error: { message: 'function missing' } })
      .mockResolvedValueOnce({ data: true, error: null })

    const token = '550e8400-e29b-41d4-a716-446655440000'
    const result = await validateAccessToken(token)

    expect(rpcMock).toHaveBeenNthCalledWith(2, 'validate_access_token', { p_token: token })
    expect(result).toEqual({ ok: true, source: 'supabase', productId: null })
  })

  it('returns not_configured when Supabase is unavailable', async () => {
    vi.resetModules()
    vi.doMock('../supabase', () => ({
      isSupabaseConfigured: () => false,
      supabase: null,
    }))

    const { validateAccessToken: validateWithoutSupabase } = await import('../access')
    const result = await validateWithoutSupabase('550e8400-e29b-41d4-a716-446655440000')

    expect(result).toEqual({ ok: false, reason: 'not_configured' })
  })
})
