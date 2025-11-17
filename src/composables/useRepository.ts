import { inject } from 'vue'
import { localRepository } from '@/repository/localStorageRepository'
import { supabaseRepository } from '@/repository/supabaseRepository'
import type { Repository } from '@/repository/webcamRepository'

export function useRepository(): Repository {
  const user = inject('user')
  return user && user.value ? supabaseRepository : localRepository
}
