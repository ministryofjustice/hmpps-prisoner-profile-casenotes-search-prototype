interface SubTypeDescription {
  _index: string
  _id: string
  _score: number | null
  _source: {
    subTypeDescription: string
  }
}

interface TypeDescription {
  _index: string
  _id: string
  _score: number | null
  _source: {
    typeDescription: string
  }
}

interface TypeDescriptions {
  hits: {
    total: {
      value: number
      relation: string
    }
    max_score: null
    hits: TypeDescription[]
  }
}

interface SubTypeDescriptions {
  hits: {
    total: {
      value: number
      relation: string
    }
    max_score: null
    hits: SubTypeDescription[]
  }
}

interface SubTypeBucket {
  key: string
  doc_count: number
  subtypeDescriptions: SubTypeDescriptions
}

interface TypeBucket {
  key: string
  doc_count: number
  typeDescriptions: TypeDescriptions
}

export interface TypeSearchAggregation {
  took: number
  timed_out: boolean
  _shards: {
    total: number
    successful: number
    skipped: number
    failed: number
  }
  hits: {
    total: {
      value: number
      relation: string
    }
    max_score: null
    hits: []
  }
  aggregations: {
    uniqueSubtypes: {
      doc_count_error_upper_bound: number
      sum_other_doc_count: number
      buckets: SubTypeBucket[]
    }
    uniqueTypes: {
      doc_count_error_upper_bound: number
      sum_other_doc_count: number
      buckets: TypeBucket[]
    }
  }
}
