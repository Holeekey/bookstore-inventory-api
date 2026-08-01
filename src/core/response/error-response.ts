export type ErrorResponse<T = unknown> = {
  code: string
  message: string
  additionalInfo?: T
}
