// Direct access to foto-webcam.eu images. Their JSON API cannot be called from
// other sites, but images live at predictable URLs, one per capture interval.

import { todayInAustria, type CamDay } from '@/services/panomax'

const BASE = 'https://www.foto-webcam.eu/webcam'

export type FotoWebcamSize = 'la' | 'lm' | 'hd'

// la: 816x459, lm: 1200x675, hd: 1920x1080
export function sizeFor(pixelHeight: number): FotoWebcamSize {
  if (pixelHeight <= 460) return 'la'
  if (pixelHeight <= 675) return 'lm'
  return 'hd'
}

export function imageUrl(id: string, date: string, time: string, size: FotoWebcamSize | 'sm'): string {
  return `${BASE}/${id}/${date.replaceAll('-', '/')}/${time.slice(0, 2)}${time.slice(3, 5)}_${size}.jpg`
}

// Every capture slot of a day, optionally only up to a given time
export function slots(intervalSeconds: number, until = '23:59:59'): string[] {
  const step = Math.max(60, intervalSeconds) / 60
  const out: string[] = []
  for (let m = 0; m < 24 * 60; m += step) {
    const t = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:00`
    if (t <= until) out.push(t)
  }
  return out
}

export function timeInAustria(now = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Vienna',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now)
}

function imageExists(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

const latestCache = new Map<string, { at: number; day: Promise<CamDay> }>()

// Today's shots up to the newest one that exists. Checks the newest few slots
// using the tiny thumbnail, since the newest shot can take a while to appear.
export function fetchLatestDay(id: string, intervalSeconds: number): Promise<CamDay> {
  const cached = latestCache.get(id)
  if (cached && Date.now() - cached.at < 50_000) return cached.day

  const day = (async () => {
    const date = todayInAustria()
    const times = slots(intervalSeconds, timeInAustria())
    for (let i = times.length - 1; i >= Math.max(0, times.length - 6); i--) {
      if (await imageExists(imageUrl(id, date, times[i], 'sm'))) {
        return { date, times: times.slice(0, i + 1) }
      }
    }
    throw new Error('No recent foto-webcam image')
  })()
  latestCache.set(id, { at: Date.now(), day })
  day.catch(() => latestCache.delete(id))
  return day
}

export async function fetchDay(id: string, intervalSeconds: number, date: string): Promise<CamDay | null> {
  if (date === todayInAustria()) return fetchLatestDay(id, intervalSeconds).catch(() => null)
  return { date, times: slots(intervalSeconds) }
}
