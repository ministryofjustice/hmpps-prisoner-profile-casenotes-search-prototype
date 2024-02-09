import { dataAccess } from '../data'
import UserService from './userService'
import SearchService from './searchService'

export const services = () => {
  const { applicationInfo, manageUsersApiClient, searchClient } = dataAccess()

  const userService = new UserService(manageUsersApiClient)
  const searchService = new SearchService(searchClient)

  return {
    applicationInfo,
    userService,
    searchService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
