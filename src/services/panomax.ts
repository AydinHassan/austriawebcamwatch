// Direct access to Panomax panorama images, so we can show them without the
// ad-heavy Panomax viewer. Be gentle with their API: day listings are cached
// and only "today" is ever re-fetched.

import type { Webcam } from '@/services/webcams'
import type { CamDay, CamSource } from '@/services/camSource'

const API = 'https://api.panomax.com/1.0'

export type Resolution = 'optimized' | 'reduced' | 'default'

export type PanomaxDay = CamDay & {
  storage: number
}

const dayCache = new Map<string, Promise<PanomaxDay | null>>()
const latestCache = new Map<number, { at: number; day: Promise<PanomaxDay> }>()
// Several viewers can show the same cam (grid + full screen), so share
// the latest-day lookup between them for a short while.
const LATEST_TTL_MS = 50_000

export function imageUrl(camId: number, day: PanomaxDay, time: string, res: Resolution): string {
  const [y, m, d] = day.date.split('-')
  return `https://panodata${day.storage}.panomax.com/cams/${camId}/${y}/${m}/${d}/${time.replaceAll(':', '-')}_${res}.jpg`
}

// Pick the smallest image that still looks sharp at the rendered height.
export function resolutionFor(pixelHeight: number): Resolution {
  if (pixelHeight <= 300) return 'optimized'
  if (pixelHeight <= 450) return 'reduced'
  return 'default'
}

function parseDay(data: any): PanomaxDay {
  return {
    date: data.date,
    storage: data.storage,
    times: (data.images ?? []).filter((i: any) => i.available !== false).map((i: any) => i.time),
  }
}

// The most recent day with images (usually today), used for polling.
export function fetchLatestDay(camId: number): Promise<PanomaxDay> {
  const cached = latestCache.get(camId)
  if (cached && Date.now() - cached.at < LATEST_TTL_MS) return cached.day

  const day = (async () => {
    const res = await fetch(`${API}/cams/${camId}/images/day`)
    if (!res.ok) throw new Error(`Panomax ${res.status}`)
    const day = parseDay(await res.json())
    dayCache.set(`${camId}/${day.date}`, Promise.resolve(day))
    return day
  })()
  latestCache.set(camId, { at: Date.now(), day })
  day.catch(() => latestCache.delete(camId))
  return day
}

// A specific day. Returns null when Panomax has no images for that date.
export function fetchDay(camId: number, date: string): Promise<PanomaxDay | null> {
  const key = `${camId}/${date}`
  const cached = dayCache.get(key)
  if (cached) return cached

  const day = (async () => {
    const res = await fetch(`${API}/cams/${camId}/images/day/${date}`)
    if (res.status === 422 || res.status === 404) return null
    if (!res.ok) throw new Error(`Panomax ${res.status}`)
    const day = parseDay(await res.json())
    return day.times.length ? day : null
  })()
  dayCache.set(key, day)
  day.catch(() => dayCache.delete(key))
  return day
}

export function source(webcam: Webcam): CamSource | null {
  const camId = webcam.camId
  if (!camId) return null
  return {
    firstDate: webcam.firstPano ?? null,
    latestDay: () => fetchLatestDay(camId),
    day: (date) => fetchDay(camId, date),
    imageUrl: (day, time, h) => imageUrl(camId, day as PanomaxDay, time, resolutionFor(h)),
  }
}
