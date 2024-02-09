import Agent, { HttpsAgent } from 'agentkeepalive'
import superagent from 'superagent'

import logger from '../../logger'
import sanitiseError from '../sanitisedError'
import type { ApiConfig } from '../config'
import { restClientMetricsMiddleware } from './restClientMetricsMiddleware'

interface Request {
  path: string
  query?: object | string
  headers?: Record<string, string>
  responseType?: string
  raw?: boolean
}

interface RequestWithBody extends Request {
  data?: Record<string, unknown>
  retry?: boolean
}

export default class RestClient {
  agent: Agent

  constructor(
    private readonly name: string,
    private readonly config: ApiConfig,
    private readonly token?: string,
  ) {
    this.agent = config.url.startsWith('https')
      ? new HttpsAgent({ ...config.agent, rejectUnauthorized: false })
      : new Agent(config.agent)
  }

  private apiUrl() {
    return this.config.url
  }

  private timeoutConfig() {
    return this.config.timeout
  }

  private basicAuth() {
    return this.config.username && this.config.password
      ? Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')
      : undefined
  }

  async get<Response = unknown>({
    path,
    query = {},
    headers = {},
    responseType = '',
    raw = false,
    data = {},
  }: RequestWithBody): Promise<Response> {
    logger.info(`${this.name} GET: ${path}`)
    const basicAuth = this.basicAuth()

    try {
      const result = await superagent
        .get(`${this.apiUrl()}${path}`)
        .query(query)
        .agent(this.agent)
        .use(restClientMetricsMiddleware)
        .retry(2, (err, res) => {
          if (err) logger.info(`Retry handler found ${this.name} API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })
        .set('Authorization', basicAuth ? `Basic ${basicAuth}` : `bearer ${this.token}`)
        .send(data)
        .set(headers)
        .responseType(responseType)
        .timeout(this.timeoutConfig())

      return raw ? result : result.body
    } catch (error) {
      const sanitisedError = sanitiseError(error)
      logger.warn({ ...sanitisedError }, `Error calling ${this.name}, path: '${path}', verb: 'GET'`)
      throw sanitisedError
    }
  }
}
