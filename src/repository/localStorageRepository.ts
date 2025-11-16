import type { Repository, Preset } from './repository'

export const localRepository: Repository = {
  loadPresets(): Preset[]|null {

    const presets = localStorage.getItem('presets')
    if (!presets) {
      return null
    }

    let raw: any
    try {
      raw = JSON.parse(presets)
    } catch {
      return null;
    }

    // if new format → return directly
    if (raw.length === 0 || raw[0].camIds) {
      return raw
    }

    // OLD FORMAT DETECTED → migrate
    const migrated = raw.map((p: any) => ({
      name: p.name,
      camIds: Array.isArray(p.cams)
        ? p.cams.map((c: any) => c.name)
        : []
    }))

    // save new format
    localStorage.setItem('presets', JSON.stringify(migrated))

    return migrated
  },

  savePresets(presets: Preset[]): void {
    localStorage.setItem('presets', JSON.stringify(presets))
  },

  selectedPreset(): string | null {
    return localStorage.getItem('selectedPreset')
  },

  setSelectedPreset(presetName: string | null): void {
    if (presetName === null) {
      localStorage.removeItem('selectedPreset')
    } else {
      localStorage.setItem('selectedPreset', presetName)
    }
  },

  hasVisited(): boolean {
    return localStorage.getItem('visited') === '1'
  },

  setVisited(): void {
    localStorage.setItem('visited', '1')
  }
}
