import logger from '../../logger'
import config from '../config'
import RestClient from './restClient'

export default class SearchClient {
  constructor() {}

  private static restClient(): RestClient {
    return new RestClient('Search Client', config.apis.opensearch)
  }

  searchCaseNotes<T>(query: Record<string, unknown>): Promise<T> {
    logger.info('Getting casenotes details: calling Casenotes search')
    return SearchClient.restClient().get<T>({
      path: '/casenotes2/_search',
      data: query,
    })
  }
}
