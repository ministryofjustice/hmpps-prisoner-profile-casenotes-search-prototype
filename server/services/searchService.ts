/* eslint-disable no-underscore-dangle */

import type SearchClient from '../data/searchClient'
import { CaseNote, SearchResponse, TypeSearchAggregation } from '../interfaces/TypeSearch'

export type SearchTerms = {
  keywords: string
  prisonNumber: string
  type?: string
  subType?: string
  startDate?: string
  endDate?: string
}

function convertToISO(dateString: string) {
  const [day, month, year] = dateString.split('/')
  const date = new Date(`${year}-${month}-${day}`)
  return date.toISOString()
}

export default class SearchService {
  constructor(private readonly searchClient: SearchClient) {}

  async search(searchTerms: SearchTerms): Promise<CaseNote[]> {
    const shouldQuery = searchTerms.keywords
      ? [
          {
            multi_match: {
              query: searchTerms.keywords,
              fields: ['additionalNoteText', 'authorName', 'caseNoteId', 'source', 'text'],
              type: 'cross_fields',
              operator: 'or',
              analyzer: 'case_notes_search_analyzer',
            },
          },
          {
            nested: {
              path: 'amendments',
              query: {
                match: {
                  'amendments.additionalNoteText': {
                    query: searchTerms.keywords,
                    fuzziness: 'AUTO',
                    analyzer: 'case_notes_search_analyzer',
                  },
                },
              },
            },
          },
        ]
      : []

    const query = {
      query: {
        bool: {
          should: shouldQuery,
          minimum_should_match: searchTerms.keywords ? '1' : '0',
          filter: this.getFilters(searchTerms),
        },
      },
      size: 3,
      highlight: {
        pre_tags: ["<em class='search-highlight'>"],
        post_tags: ['</em>'],
        fields: {
          additionalNoteText: {},
          authorName: {},
          caseNoteId: {},
          source: {},
          text: {},
          'amendments.additionalNoteText': {},
        },
      },
    }

    const resp = await this.searchClient.searchCaseNotes<SearchResponse>(query)

    // create new object by converting values of rawRecord.highlight to string

    return resp.hits.hits.map(rawRecord => {
      const highlights = rawRecord.highlight
        ? Object.fromEntries(Object.entries(rawRecord.highlight).map(([key, value]) => [key, value[0]]))
        : {}
      return { ...rawRecord._source, ...highlights }
    })
  }

  getFilters(searchTerms: SearchTerms) {
    const filterQuery = []

    filterQuery.push({
      match: {
        offenderIdentifier: searchTerms.prisonNumber,
      },
    })

    if (searchTerms.type) {
      filterQuery.push({
        term: {
          'type.keyword': searchTerms.type,
        },
      })
    }

    if (searchTerms.subType) {
      filterQuery.push({
        term: {
          'subType.keyword': searchTerms.subType,
        },
      })
    }

    let dateRange = {}

    if (searchTerms.startDate) {
      dateRange = {
        ...dateRange,
        gte: convertToISO(searchTerms.startDate),
      }
    }

    if (searchTerms.endDate) {
      dateRange = {
        ...dateRange,
        lte: convertToISO(searchTerms.endDate),
      }
    }

    if (searchTerms.startDate || searchTerms.endDate) {
      filterQuery.push({
        range: {
          creationDateTime: dateRange,
        },
      })
    }

    return filterQuery
  }

  async getAlertTypes(): Promise<{
    types: { value: string; text: string }[]
    subTypes: { value: string; text: string }[]
  }> {
    const query = {
      size: 0,
      aggs: {
        uniqueTypes: {
          terms: {
            field: 'type.keyword',
            size: 10,
          },
          aggs: {
            typeDescriptions: {
              top_hits: {
                size: 1,
                _source: ['typeDescription'],
              },
            },
          },
        },
        uniqueSubtypes: {
          terms: {
            field: 'subType.keyword',
            size: 10,
          },
          aggs: {
            subtypeDescriptions: {
              top_hits: {
                size: 1,
                _source: ['subTypeDescription'],
              },
            },
          },
        },
      },
    }
    const resp = await this.searchClient.searchCaseNotes<TypeSearchAggregation>(query)
    const typeBuckets = resp.aggregations.uniqueTypes.buckets
    const subTypeBuckets = resp.aggregations.uniqueSubtypes.buckets

    return {
      types: typeBuckets.map(typeBucket => ({
        value: typeBucket.key,
        text: typeBucket.typeDescriptions.hits.hits[0]._source.typeDescription,
      })),
      subTypes: subTypeBuckets.map(subTypeBucket => ({
        value: subTypeBucket.key,
        text: subTypeBucket.subtypeDescriptions.hits.hits[0]._source.subTypeDescription,
      })),
    }
  }
}
