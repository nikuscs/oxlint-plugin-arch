export interface BackendOrpcOutputOptions {
  composers: string[]
  handlerMethod?: string
  outputMethod?: string
}

export interface BackendServiceFunctionsOptions {
  frontend?: boolean
  allowLocalHelpers?: boolean
  allowReturnedMethods?: boolean
  singleExport?: boolean
  message?: string
}

export interface BackendSqlLikeOptions {
  methods: string[]
  sanitizers: string[]
  allowSanitizedBindings?: boolean
  operatorMethods?: string[]
}
