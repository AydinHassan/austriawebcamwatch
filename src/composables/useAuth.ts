import { ref, onMounted, onBeforeUnmount } from 'vue'
import useSupabase from '@/composables/useSupabase'

const user = ref(null)
const authenticatedCallbacks = []

export default function useAuth() {
  const { supabase } = useSupabase()
  let authListener = null

  async function login(provider: string) {
    await supabase.auth.signInWithOAuth({ provider })
  }

  function onAuthenticated(callback) {
    authenticatedCallbacks.push(callback)
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  onMounted(async () => {
    const { data } = await supabase.auth.getUser();
    user.value = data.user ?? null;

    for (const callback of authenticatedCallbacks) {
      await callback(user.value);
    }

    authListener = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        user.value = null
      }

      if (event === 'SIGNED_IN') {
        user.value = session?.user ?? null
      }
    })
  })

  onBeforeUnmount(() => {
    authListener?.data.subscription.unsubscribe()
  })

  return { user, login, logout, onAuthenticated }
}
