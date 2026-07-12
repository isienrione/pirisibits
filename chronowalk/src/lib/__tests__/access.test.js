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

    expect(result).toEqual({ ok: true, source: 'dev' })
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('validates purchase tokens through Supabase RPC', async () => {
    rpcMock.mockResolvedValue({ data: true, error: null })

    const token = '550e8400-e29b-41d4-a716-446655440000'
    const result = await validateAccessToken(token)

    expect(rpcMock).toHaveBeenCalledWith('validate_access_token', { p_token: token })
    expect(result).toEqual({ ok: true, source: 'supabase' })
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
