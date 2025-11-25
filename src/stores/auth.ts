import { defineStore } from 'pinia'
import { ref } from 'vue'
import useSupabase from '@/composables/useSupabase'

export const useAuthStore = defineStore('auth', () => {
  const { supabase } = useSupabase()
  const user = ref(null)
  let initialised = false

  async function init() {
    if (initialised) {
      return
    }

    const { data } = await supabase.auth.getUser();
    user.value = data.user ?? null;

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        user.value = null
      }
      if (event === 'SIGNED_IN') {
        user.value = session?.user ?? null
      }
    });

    initialised = true;
  }

  async function login(provider) {
    await supabase.auth.signInWithOAuth({ provider })
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return { user, init, login, logout }
})
