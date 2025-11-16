import { localRepository } from '@/repository/localStorageRepository'
import { Repository} from '@/repository/webcamRepository'

export function useRepository(): Repository {
  return localRepository
}
