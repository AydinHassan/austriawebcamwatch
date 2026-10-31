import { describe, it, expect, vi, beforeEach } from 'vitest'
import { bergfexId, fetchDay } from '@/services/bergfex'

describe('bergfex service', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads the cam id from the embed url', () => {
    expect(bergfexId('https://content.bergfex.at/webcam/?id=24427&initTagManager=1')).toBe('24427')
    expect(bergfexId('https://example.com/')).toBeNull()
  })

  it('turns the archive into times with image urls', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => [
        { hour: 12, min: 30, src: 'https://vcdn.bergfex.at/b.jpg' },
        { hour: 9, min: 0, src: 'https://vcdn.bergfex.at/a.jpg' },
      ],
    })))
    const day = await fetchDay('1', '2020-01-01')
    expect(day?.times).toEqual(['09:00:00', '12:30:00'])
    expect(day?.srcs['12:30:00']).toBe('https://vcdn.bergfex.at/b.jpg')
  })

  it('treats an empty archive as no images', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => null })))
    expect(await fetchDay('2', '2020-01-01')).toBeNull()
  })
})
