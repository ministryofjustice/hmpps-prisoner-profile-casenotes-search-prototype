/* eslint-disable no-param-reassign */
import path from 'path'
import nunjucks from 'nunjucks'
import express from 'express'
import { format, parseISO } from 'date-fns'
import { initialiseName } from './utils'
import { ApplicationInfo } from '../applicationInfo'
import config from '../config'
import { HmppsError } from '../interfaces/hmppsError'
import { CaseNote } from '../interfaces/TypeSearch'

const production = process.env.NODE_ENV === 'production'

export default function nunjucksSetup(app: express.Express, applicationInfo: ApplicationInfo): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Hmpps Prisoner Profile Casenotes Search Prototype'
  app.locals.environmentName = config.environmentName
  app.locals.environmentNameColour = config.environmentName === 'PRE-PRODUCTION' ? 'govuk-tag--green' : ''

  // Cachebusting version string
  if (production) {
    // Version only changes with new commits
    app.locals.version = applicationInfo.gitShortHash
  } else {
    // Version changes every request
    app.use((req, res, next) => {
      res.locals.version = Date.now().toString()
      return next()
    })
  }

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/dist/',
      'node_modules/govuk-frontend/dist/components/',
      'node_modules/@ministryofjustice/frontend/',
      'node_modules/@ministryofjustice/frontend/moj/components/',
    ],
    {
      autoescape: true,
      express: app,
    },
  )

  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter(
    'setSelected',
    (items: { value: string; text: string }[], selected) =>
      items &&
      items.map(entry => ({
        ...entry,
        selected: entry && String(entry.value) === String(selected),
      })),
  )
  njkEnv.addFilter('addDefaultSelectedValue', (items, text) => {
    if (!items) return null

    return [
      {
        text,
        value: '',
        selected: true,
      },
      ...items,
    ]
  })
  njkEnv.addFilter('findError', (errors: HmppsError[], formFieldId: string) => {
    if (!errors) return null
    const item = errors.find((error: HmppsError) => error.href === `#${formFieldId}`)
    if (item) {
      return {
        text: item.text,
      }
    }
    return null
  })

  njkEnv.addFilter('toCaseNoteSummaryList', (casenote: CaseNote): SummaryListItem[] => {
    return Object.entries(casenote)
      .map(([key, value]) => {
        if (
          key === 'subType' ||
          key === 'caseNoteId' ||
          key === 'authorUserId' ||
          key === 'eventId' ||
          key === 'source' ||
          key === 'creationDateTime' ||
          key === 'authorName' ||
          key === 'subTypeDescription' ||
          key === 'typeDescription' ||
          key === 'type' ||
          key === 'offenderIdentifier'
        )
          return null

        if (key === 'amendments') {
          return {
            key: { text: keyMapper[key as keyof CaseNote] },
            value: {
              html: (value as CaseNote['amendments'])
                .map(amendment => {
                  return `<details class='govuk-details govuk-!-margin-bottom-1'>
                            <summary class='govuk-details__summary'>
                              <span class='govuk-details__summary-text'>
                                 ${amendment.additionalNoteText}
                              </span>
                            </summary>
                            <div class='govuk-details__text'>
                              ${amendment.authorName} - ${formatDate(amendment.creationDateTime)} <br /><br />
                              ${amendment.additionalNoteText}
                            </div>
                          </details>`
                })
                .join(''),
            },
          }
        }

        return {
          key: { text: keyMapper[key as keyof CaseNote] },
          value: {
            html: key === 'creationDateTime' || key === 'occurrenceDateTime' ? formatDate(value) : String([value]),
          },
        }
      })
      .filter(Boolean)
      .sort((a, b) => {
        // bring 'text' key to the top
        if (a.key.text === keyMapper.text) return -1
        if (a.key.text === keyMapper.occurrenceDateTime) return -1
        return 0
      })
  })

  njkEnv.addFilter('formatDateTime', formatDate)
}

function formatDate(isoDateString: string) {
  const date = parseISO(isoDateString)
  return format(date, "iiii dd MMMM yyyy 'at' HH:mm")
}

type SummaryListItem = { key: { text: string }; value: { html: string } }

const keyMapper: Record<keyof CaseNote, string> = {
  caseNoteId: 'ID',
  offenderIdentifier: 'Offender ID',
  eventId: 'Event ID',
  sensitive: 'Sensitive',
  type: 'Type',
  subType: 'Sub type',
  typeDescription: 'Type description',
  subTypeDescription: 'Sub type description',
  authorName: 'Author name',
  authorUserId: 'Author user id',
  creationDateTime: 'Creation date time',
  occurrenceDateTime: 'Happened',
  locationId: 'Location ID',
  source: 'Source',
  text: 'Case note',
  amendments: 'Amendments',
}
