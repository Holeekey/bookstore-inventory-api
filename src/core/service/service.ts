import { Result } from '../result/result';

export interface Service<T, R> {
  execute(data: T): Promise<Result<R>>;
}
