import { supabaseRepository } from '@/repository/supabaseRepository'
import { localRepository } from '@/repository/localStorageRepository'
import { useAuthStore } from '@/stores/auth'
import type { Repository } from '@/repository/webcamRepository'
import { RepositoryType } from '@/repository/webcamRepository'

export function useRepository() {
  const auth = useAuthStore()

  function getRepo(type: RepositoryType = RepositoryType.AUTO): Repository {
    if (type === RepositoryType.AUTO) {
      return auth.user ? supabaseRepository : localRepository
    }
    if (type === RepositoryType.LOCAL) {
      return localRepository;
    }
    return supabaseRepository;
  }

  return {
    getRepo
  }
}
