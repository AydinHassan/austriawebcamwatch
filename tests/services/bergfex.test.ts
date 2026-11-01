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
      if (size instanceof Error) {
        throw size
      }
      return { ok: true, json: async () => size }
    }))

  it('takes the newest shots from any size, preferring the largest copy', async () => {
    stubSizes({
      5: [{ hour: 7, min: 0, src: 'large-0700.jpg' }],
      2: [
        { hour: 7, min: 0, src: 'mid-0700.jpg' },
        { hour: 7, min: 45, src: 'mid-0745.jpg' },
      ],
      1: [
        { hour: 7, min: 45, src: 'small-0745.jpg' },
        { hour: 8, min: 0, src: 'small-0800.jpg' },
      ],
    })
    const day = await fetchLatestDay('3')
    expect(day.times).toEqual(['07:00:00', '07:45:00', '08:00:00'])
    expect(day.srcs).toEqual({
      '07:00:00': 'large-0700.jpg',
      '07:45:00': 'mid-0745.jpg',
      '08:00:00': 'small-0800.jpg',
    })
  })

  it('still shows what it can when some sizes fail', async () => {
    stubSizes({ 5: new Error('down'), 3: [{ hour: 7, min: 0, src: 'large-0700.jpg' }] })
    expect((await fetchLatestDay('4')).times).toEqual(['07:00:00'])
  })
})
