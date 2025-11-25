import type { Repository, Preset, UserSettings } from './webcamRepository'

export const localRepository: Repository = {
  async loadPresets(): Promise<Preset[]|null> {

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

  async savePresets(presets: Preset[] | null): Promise<void> {
    if (presets === null) {
      localStorage.removeItem('presets');
    }

    localStorage.setItem('presets', JSON.stringify(presets))
  },

  async loadSettings(): Promise<UserSettings> {
    return {
      selectedPreset: localStorage.getItem('selectedPreset') ?? null,
      visited: localStorage.getItem('visited') === '1',
    }
  },

  async saveSettings(settings: UserSettings): Promise<void> {
    if (settings.selectedPreset === null) {
      localStorage.removeItem('selectedPreset')
    } else {
      localStorage.setItem('selectedPreset', settings.selectedPreset)
    }

    if (settings.visited) {
      localStorage.setItem('visited', '1')
    }
  },
}
