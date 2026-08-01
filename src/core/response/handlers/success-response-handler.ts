import { Result } from 'src/core/result/result'

export const successResponseHandler = <T>(result: Result<T>): T =>
  result.unwrap()
