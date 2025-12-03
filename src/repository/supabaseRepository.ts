import type { Repository, PresetEntity, UserSettings } from './webcamRepository'
import useSupabase from '@/composables/useSupabase'

const { supabase } = useSupabase();

export const supabaseRepository: Repository = {
  async loadPresets(): Promise<PresetEntity[] | null> {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      throw userError
    }

    const { data, error } = await supabase
      .from('presets')
      .select('id, name, cam_ids')
      .eq('user_id', user.id)

    if (error) {
      throw error
    }
    if (!data || data.length === 0) {
      return null
    }

    return data.map(p => ({
      id: p.id,
      name: p.name,
      camIds: p.cam_ids
    }))
  },

  async savePresets(presets: PresetEntity[]): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      throw userError
    }

    const { error: deleteError } = await supabase
      .from('presets')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      throw deleteError
    }

    if (presets.length === 0) {
      return
    }

    const { error: insertError } = await supabase.from('presets').insert(
      presets.map(p => ({
        id: p.id,
        user_id: user.id,
        name: p.name,
        cam_ids: p.camIds
      }))
    )

    if (insertError) {
      throw insertError
    }
  },

  async addPreset(preset: PresetEntity): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      throw userError
    }

    const { error } = await supabase.from('presets').insert({
      id: preset.id,
      user_id: user.id,
      name: preset.name,
      cam_ids: preset.camIds
    })

    if (error) {
      throw error
    }
  },

  async deletePreset(id: string): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      throw userError
    }

    const { error } = await supabase
      .from('presets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }
  },

  async addCamToPreset(id: string, camId: string): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      throw userError
    }

    const { error } = await supabase.rpc('add_cam_to_preset', {
      preset_id: id,
      cam_id: camId,
      p_user_id: user.id
    })

    if (error) {
      throw error
    }
  },

  async removeCamFromPreset(id: string, camId: string): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      throw userError
    }

    const { error } = await supabase.rpc('remove_cam_from_preset', {
      preset_id: id,
      cam_id: camId,
      p_user_id: user.id
    })

    if (error) {
      throw error
    }
  },

  async loadSettings(): Promise<UserSettings> {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      throw userError
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('selected_preset, visited')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (data === null) {
      return {visited: false, selectedPreset: null}
    }

    return {
      selectedPreset: data.selected_preset,
      visited: data.visited,
    }
  },

  async saveSettings(settings: UserSettings): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      throw userError
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, selected_preset: settings.selectedPreset, visited: settings.visited })

    if (error) {
      throw error
    }
  },
}
