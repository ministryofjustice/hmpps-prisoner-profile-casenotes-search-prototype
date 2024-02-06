/* eslint-disable no-underscore-dangle */

import type SearchClient from '../data/searchClient'
import { TypeSearchAggregation } from '../interfaces/TypeSearch'

export type SearchTerms = {
  keywords: string
}

export type SearchResponse = Record<string, unknown>

export default class SearchService {
  constructor(private readonly searchClient: SearchClient) {}

  // TODO: Implement search
  // async search(searchTerms: SearchTerms): Promise<SearchResponse> {
  // }

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
