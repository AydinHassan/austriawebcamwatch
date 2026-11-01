import { describe, it, expect, vi, beforeEach } from 'vitest'
import { bergfexId, fetchDay, fetchLatestDay } from '@/services/bergfex'

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

  const stubSizes = (sizes: Record<string, unknown>) =>
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const size = sizes[new URL(url).searchParams.get('size')!]
      if (size instanceof Error) throw size
      return { ok: true, json: async () => size }
    }))

  it('fills shots missing from the full size list with smaller ones', async () => {
    stubSizes({
      3: [{ hour: 7, min: 0, src: 'full-0700.jpg' }],
      2: [
        { hour: 7, min: 0, src: 'small-0700.jpg' },
        { hour: 7, min: 45, src: 'small-0745.jpg' },
      ],
    })
    const day = await fetchLatestDay('3')
    expect(day.times).toEqual(['07:00:00', '07:45:00'])
    expect(day.srcs).toEqual({ '07:00:00': 'full-0700.jpg', '07:45:00': 'small-0745.jpg' })
  })

  it('still shows the full size list when the smaller one fails', async () => {
    stubSizes({ 3: [{ hour: 7, min: 0, src: 'full-0700.jpg' }], 2: new Error('down') })
    expect((await fetchLatestDay('4')).times).toEqual(['07:00:00'])
  })
})
