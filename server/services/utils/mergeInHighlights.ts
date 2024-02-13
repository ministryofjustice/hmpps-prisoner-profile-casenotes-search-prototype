/* eslint-disable no-underscore-dangle */
import { HighlightKey, SearchResponse } from '../../interfaces/TypeSearch'

export const HIGHLIGHT_TAG = "<em class='search-highlight'>"
export const HIGHLIGHT_CLOSE_TAG = '</em>'

const highlightTag = new RegExp(HIGHLIGHT_TAG, 'g')
const highlightCloseTag = new RegExp(HIGHLIGHT_CLOSE_TAG, 'g')
export default function mergeInHighlights(searchResponse: SearchResponse) {
  return searchResponse.hits.hits.map(rawRecord => {
    const allHighlights = rawRecord.highlight
    const caseNote = rawRecord._source

    if (!allHighlights) return caseNote

    return Object.entries(allHighlights).reduce((acc, [key, highlightsForKey]: [HighlightKey, string[]]) => {
      if (key === 'amendments.additionalNoteText') {
        return acc
      }
      function getNewText(originalText: string, highlights: string[]) {
        if (!highlights.length) return originalText
        const [highlight, ...rest] = highlights

        const strippedTags = highlight.replace(highlightTag, '').replace(highlightCloseTag, '')
        const replacedText = originalText.replace(strippedTags, highlight)

        return getNewText(replacedText, rest)
      }

      return { ...acc, [key]: getNewText(caseNote[key] as string, highlightsForKey ?? []) }
    }, caseNote)
  })
}
