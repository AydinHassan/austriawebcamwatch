// One interface over the providers our viewer can show directly
import type { Webcam } from '@/services/webcams'
import * as panomax from '@/services/panomax'
import * as fotoWebcam from '@/services/fotoWebcam'
import * as bergfex from '@/services/bergfex'
import type { CamDay, PanomaxDay } from '@/services/panomax'

export type CamSource = {
  // Earliest date with images, when known
  firstDate: string | null
  latestDay(): Promise<CamDay>
  day(date: string): Promise<CamDay | null>
  imageUrl(day: CamDay, time: string, pixelHeight: number): string
}

export function camSource(webcam: Webcam): CamSource {
  if (webcam.provider === 'bergfex') {
    const id = bergfex.bergfexId(webcam.url)!
    return {
      firstDate: null,
      latestDay: () => bergfex.fetchLatestDay(id),
      day: (date) => bergfex.fetchDay(id, date),
      imageUrl: (day, time) => (day as bergfex.BergfexDay).srcs[time],
    }
  }

  if (webcam.provider === 'foto-webcam') {
    const id = webcam.fotoWebcamId!
    const interval = webcam.captureInterval ?? 600
    return {
      firstDate: null,
      latestDay: () => fotoWebcam.fetchLatestDay(id, interval),
      day: (date) => fotoWebcam.fetchDay(id, interval, date),
      imageUrl: (day, time, h) => fotoWebcam.imageUrl(id, day.date, time, fotoWebcam.sizeFor(h)),
    }
  }

  const camId = webcam.camId!
  return {
    firstDate: webcam.firstPano ?? null,
    latestDay: () => panomax.fetchLatestDay(camId),
    day: (date) => panomax.fetchDay(camId, date),
    imageUrl: (day, time, h) => panomax.imageUrl(camId, day as PanomaxDay, time, panomax.resolutionFor(h)),
  }
}
