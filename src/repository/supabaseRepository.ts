import type { Repository, Preset, UserSettings } from './webcamRepository'
import useSupabase from '@/composables/useSupabase'

const { supabase } = useSupabase();

export const supabaseRepository: Repository = {
  async loadPresets(): Promise<Preset[] | null> {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('presets')
      .select('name, cam_ids')
      .eq('user_id', user.id)

    if (error) {
      return null
    }
    if (!data) {
      return null
    }

    if (data.length === 0) {
      return null
    }

    return data.map(p => ({
      name: p.name,
      camIds: p.cam_ids
    }))
  },

  async savePresets(presets: Preset[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('presets')
      .delete()
      .eq('user_id', user.id)

    if (presets.length === 0) {
      return
    }

    await supabase.from('presets').insert(
      presets.map(p => ({
        user_id: user.id,
        name: p.name,
        cam_ids: p.camIds
      }))
    )
  },

  async loadSettings(): Promise<UserSettings> {
    const { data: { user } } = await supabase.auth.getUser()

    const { data } = await supabase
      .from('user_settings')
      .select('selected_preset, visited')
      .eq('user_id', user.id)
      .maybeSingle()

    if (data === null) {
      return {visited: false, selectedPreset: null}
    }

    return {
      selectedPreset: data.selected_preset,
      visited: data.visited,
    }
  },

  async saveSettings(settings: UserSettings): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, selected_preset: settings.selectedPreset, visited: settings.visited })
  },
}
