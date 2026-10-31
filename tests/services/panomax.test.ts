import { fetchDay, imageUrl, resolutionFor, type PanomaxDay } from '@/services/panomax'
import { neighbourShot, shiftDate, todayInAustria } from '@/services/camSource'

const dayResponse = (date: string, times: string[], storage = 42) => ({
  date,
  storage,
  sizes: [],
  images: times.map((time) => ({ time, available: true })),
})

function mockFetch(days: Record<string, string[]>) {
  const fn = vi.fn(async (url: string) => {
    const date = url.split('/').pop()!
    if (!days[date]) return { ok: false, status: 422, json: async () => ({}) }
    return { ok: true, status: 200, json: async () => dayResponse(date, days[date]) }
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('panomax service', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds image urls from storage, date and time', () => {
    const day: PanomaxDay = { date: '2025-12-25', storage: 16, times: [] }
    expect(imageUrl(180, day, '12:00:00', 'reduced')).toBe(
      'https://panodata16.panomax.com/cams/180/2025/12/25/12-00-00_reduced.jpg',
    )
  })

  it('picks the smallest sharp resolution', () => {
    expect(resolutionFor(250)).toBe('optimized')
    expect(resolutionFor(450)).toBe('reduced')
    expect(resolutionFor(900)).toBe('default')
  })

  it('shifts dates across month and year boundaries', () => {
    expect(shiftDate('2026-01-01', -1)).toBe('2025-12-31')
    expect(shiftDate('2024-02-28', 1)).toBe('2024-02-29')
  })

  it('uses the Austrian date', () => {
    expect(todayInAustria(new Date('2026-10-30T23:30:00Z'))).toBe('2026-10-31')
  })

  it('caches days, including days without images', async () => {
    const fetchMock = mockFetch({ '2026-01-10': ['10:00:00'] })
    expect(await fetchDay(1, '2026-01-10')).toMatchObject({ storage: 42, times: ['10:00:00'] })
    expect(await fetchDay(1, '2026-01-10')).not.toBeNull()
    expect(await fetchDay(1, '2026-01-11')).toBeNull()
    expect(await fetchDay(1, '2026-01-11')).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('steps within a day and across missing days', async () => {
    mockFetch({ '2026-03-01': ['22:00:00', '23:50:00'] })
    const day: PanomaxDay = { date: '2026-03-03', storage: 42, times: ['00:00:00', '00:10:00'] }
    const bounds = { min: '2020-01-01', max: '2026-03-03' }

    expect(await neighbourShot((d) => fetchDay(2, d), day, '00:00:00', 1, bounds)).toMatchObject({ time: '00:10:00' })

    const back = await neighbourShot((d) => fetchDay(2, d), day, '00:00:00', -1, bounds)
    expect(back?.day.date).toBe('2026-03-01')
    expect(back?.time).toBe('23:50:00')
  })

  it('stops at the bounds', async () => {
    const fetchMock = mockFetch({})
    const day: PanomaxDay = { date: '2026-03-03', storage: 42, times: ['00:00:00'] }
    expect(await neighbourShot((d) => fetchDay(3, d), day, '00:00:00', 1, { max: '2026-03-03' })).toBeNull()
    expect(await neighbourShot((d) => fetchDay(3, d), day, '00:00:00', -1, { min: '2026-03-03', max: '2026-03-03' })).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('panomax request sharing', () => {
  it('shares concurrent requests for the same day', async () => {
    const fetchMock = mockFetch({ '2026-05-05': ['10:00:00'] })
    await Promise.all([fetchDay(9, '2026-05-05'), fetchDay(9, '2026-05-05')])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
