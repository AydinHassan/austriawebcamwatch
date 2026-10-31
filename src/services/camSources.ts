// Providers whose images our own viewer can show
import type { Webcam } from '@/services/webcams'
import type { CamSource } from '@/services/camSource'
import * as panomax from '@/services/panomax'
import * as fotoWebcam from '@/services/fotoWebcam'
import * as bergfex from '@/services/bergfex'

const providers: Record<string, (webcam: Webcam) => CamSource | null> = {
  panomax: panomax.source,
  'foto-webcam': fotoWebcam.source,
  bergfex: bergfex.source,
}

export function camSource(webcam: Webcam): CamSource | null {
  return providers[webcam.provider]?.(webcam) ?? null
}

export function hasOwnViewer(webcam: Webcam): boolean {
  return camSource(webcam) !== null
}
