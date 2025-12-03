import { useRepository } from '@/composables/useRepository'
import { RepositoryType, PresetEntity, SPECIAL_PRESETS, DEFAULT_PRESET_IDS } from '@/repository/webcamRepository'
import { usePresetsStore } from '@/stores/presets'

function isValidPresetData(json: string): boolean {
  let data

  try {
    data = JSON.parse(json)
  } catch {
    return false
  }

  if (!Array.isArray(data)) {
    return false
  }

  if (data.length === 0) {
    return false
  }

  for (const item of data) {
    if (!item || typeof item !== 'object') {
      return false
    }

    if (typeof item.name !== 'string') {
      return false
    }

    if (!Array.isArray(item.camIds)) {
      return false
    }

    for (const cam of item.camIds) {
      if (typeof cam !== 'string') {
        return false
      }
    }
  }
  return true
}

function normalizePresets(presets: any[]): PresetEntity[] {
  const nameToIdMap: Record<string, string> = {
    [SPECIAL_PRESETS.DEFAULT]: DEFAULT_PRESET_IDS.DEFAULT,
    [SPECIAL_PRESETS.RANDOM]: DEFAULT_PRESET_IDS.RANDOM,
  }
  
  return presets.map(preset => ({
    id: preset.id || nameToIdMap[preset.name] || crypto.randomUUID(),
    name: preset.name,
    camIds: preset.camIds
  }))
}

export function useImportExport() {
  const { getRepo } = useRepository()

  async function importPresets(data: string): Promise<void> {
    if (!isValidPresetData(data)) {
      throw new Error('Invalid preset data format')
    }

    const rawPresets = JSON.parse(data)
    const presets = normalizePresets(rawPresets)

    await getRepo(RepositoryType.AUTO).savePresets(presets)
    await getRepo(RepositoryType.AUTO).saveSettings({ selectedPreset: presets[0].id, visited: true })

    usePresetsStore().init()
  }

  async function getPresetsForExport(): Promise<PresetEntity[]> {
    return await getRepo(RepositoryType.AUTO).loadPresets() ?? []
  }

  return { importPresets, getPresetsForExport }
}
