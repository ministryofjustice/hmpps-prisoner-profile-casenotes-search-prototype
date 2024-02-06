import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes(service: Services): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res, next) => {
    // const searchResponse = req.query.keywords ? await service.searchService.search(req.query as SearchTerms) : null
    const alertTypes = await service.searchService.getAlertTypes()

    res.render('pages/index', { searchResponse: [], alertTypes })
  })

  return router
}
