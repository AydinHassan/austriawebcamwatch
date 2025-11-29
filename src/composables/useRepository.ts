import { supabaseRepository } from '@/repository/supabaseRepository'
import { localRepository } from '@/repository/localStorageRepository'
import { getWebcamByName } from '@/services/webcams'
import { useAuthStore } from '@/stores/auth'
import type { Repository, Preset, UserSettings } from './webcamRepository'

const defaultPresets = [
  { name: 'Default preset', cams: [] },
  { name: 'Random', cams: [] },
]

function isValidPresetData(json: string): Boolean {
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
    return false;
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

export function useRepository() {
  const auth = useAuthStore()

  function getRepo(type: null|'local'|'remote'): Repository {
    if (type === null || type === undefined) {
      return auth.user ? supabaseRepository : localRepository
    }
    if (type === 'local') {
      return localRepository;
    }
    return supabaseRepository;
  }

  async function loadSettings(type: null|'local'|'remote'): Promise<UserSettings> {
    return getRepo(type).loadSettings();
  }

  async function getPresetsForExport(): Promise<Preset[]> {
    return await getRepo(null).loadPresets() ?? [];
  }

  async function importPresets(data: string): Promise<void> {
    if (!isValidPresetData(data)) {
      return;
    }

    const presets = JSON.parse(data);
    await getRepo(null).savePresets(presets);
    await getRepo().saveSettings({selectedPreset: presets[0].name, visited: true})
  }

  async function loadPresets(type: null|'local'|'remote'): Promise<Preset[]> {
    const repo = getRepo(type);

    const presets = await repo.loadPresets()

    if (presets === null) {
      return defaultPresets
    }

    return presets.map(p => ({
      name: p.name,
      cams: p.camIds.map(id => getWebcamByName(id))
    }))
  }

  async function saveSettings(userSettings: UserSettings, type: null|'local'|'remote', ): Promise<void> {
    await getRepo(type).saveSettings(userSettings)
  }

  async function savePresets(userPresets: array<Preset>, type: null|'local'|'remote', ): Promise<void> {

    console.log('savePresets', userPresets)
    if (!userPresets) {
      return
    }

    const toSave = userPresets.map(p => {
      if (p.name === 'Random') {
        return { name: p.name, camIds: [] }
      }
      return {
        name: p.name,
        camIds: p.cams.map(c => c.name)
      }
    })

    await getRepo(type).savePresets(toSave)
  }

  async function removeLocalData(): Promise<void> {
    await localRepository.savePresets([]);
    await localRepository.saveSettings({selectedPreset: null, visited: true});
  }

  return {
    loadPresets,
    loadSettings,
    saveSettings,
    savePresets,
    removeLocalData,
    defaultPresets,
    getPresetsForExport,
    importPresets
  }
}
