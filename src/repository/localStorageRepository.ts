import type { Repository, PresetEntity, UserSettings } from './webcamRepository'

export const localRepository: Repository = {
  async loadPresets(): Promise<PresetEntity[]|null> {
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

    if (raw.length === 0 || (raw[0].camIds && raw[0].id)) {
      return raw
    }

    localStorage.setItem('presets', [])

    return []
  },

  async savePresets(presets: PresetEntity[]): Promise<void> {
    localStorage.setItem('presets', JSON.stringify(presets))
  },

  async addPreset(preset: PresetEntity): Promise<void> {
    const presets = await this.loadPresets() || []
    presets.push(preset)
    await this.savePresets(presets)
  },

  async deletePreset(id: string): Promise<void> {
    const presets = await this.loadPresets()
    if (!presets) {
      return
    }

    const filtered = presets.filter(p => p.id !== id)
    await this.savePresets(filtered)
  },

  async addCamToPreset(id: string, camId: string): Promise<void> {
    const presets = await this.loadPresets()
    if (!presets) {
      return
    }

    const preset = presets.find(p => p.id === id)
    if (!preset) {
      return
    }

    if (!preset.camIds.includes(camId)) {
      preset.camIds.push(camId)
      await this.savePresets(presets)
    }
  },

  async removeCamFromPreset(id: string, camId: string): Promise<void> {
    const presets = await this.loadPresets()
    if (!presets) {
      return
    }

    const preset = presets.find(p => p.id === id)
    if (!preset) {
      return
    }

    preset.camIds = preset.camIds.filter(c => c !== camId)
    await this.savePresets(presets)
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

  deletePresets(): void {
    localStorage.removeItem('presets')
  }
}
