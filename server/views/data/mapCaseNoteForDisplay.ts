import { CaseNote } from '../../interfaces/TypeSearch'
import formatDate from './formatDate'

type SummaryListItem = { key: { text: string }; value: { html: string } }
export default function mapCaseNoteForDisplay(casenote: CaseNote): SummaryListItem[] {
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
        key === 'offenderIdentifier' ||
        key === 'sensitive'
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
    .sort(a => {
      // bring 'text' key to the top
      if (a.key.text === keyMapper.text) return -1
      if (a.key.text === keyMapper.occurrenceDateTime) return -1
      return 0
    })
}

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
