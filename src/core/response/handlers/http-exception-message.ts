import { HttpException } from '@nestjs/common'

// The ValidationPipe puts its errors in `message` as a string[]; flatten it so
// the client body and the log line carry the same text.
export const httpExceptionMessage = (exception: HttpException): string => {
  const response = exception.getResponse()

  if (typeof response === 'string') return response

  const payload = response as Record<string, unknown>

  if (Array.isArray(payload.message)) return payload.message.join(', ')
  if (typeof payload.message === 'string') return payload.message
  return exception.message
}
