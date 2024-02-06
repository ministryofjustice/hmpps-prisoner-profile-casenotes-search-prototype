/* eslint-disable no-underscore-dangle */

import type SearchClient from '../data/searchClient'
import { CaseNote, SearchResponse, TypeSearchAggregation } from '../interfaces/TypeSearch'

export type SearchTerms = {
  keywords: string
  type?: string
  subType?: string
}

export default class SearchService {
  constructor(private readonly searchClient: SearchClient) {}

  async search(searchTerms: SearchTerms): Promise<CaseNote[]> {
    const query = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: searchTerms.keywords,
                fields: ['additionalNoteText', 'authorName', 'caseNoteId', 'source', 'text'],
                type: 'cross_fields',
                operator: 'or',
              },
            },
          ],
        },
      },
    }

    if (searchTerms.type) {
      query.query.bool.must.push({
        match: {
          type: searchTerms.type,
        },
      })
    }

    if (searchTerms.subType) {
      query.query.bool.must.push({
        match: {
          subType: searchTerms.subType,
        },
      })
    }

    const resp = await this.searchClient.searchCaseNotes<SearchResponse>(query)

    return resp.hits.hits.map(rawRecord => rawRecord._source)
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
