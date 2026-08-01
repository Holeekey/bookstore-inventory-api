import { Exception } from '../exception/exception';

export class Result<T> {
  private constructor(
    private value?: T,
    private exception?: Exception,
    private info?: any,
  ) {
    if (value !== undefined && exception !== undefined)
      throw new Error('Value and error not to be definined same time');
    if (value === undefined && exception === undefined)
      throw new Error('Value and error not to be undefined same time');
  }

  unwrap(): T {
    if (this.exception) throw this.exception;
    return this.value!;
  }

  getInfo(): any {
    if (this.exception) throw this.exception;
    return this.info!;
  }

  isException() {
    return Boolean(this.exception);
  }

  handleError<R>(handler: (e: Exception) => R) {
    if (!this.isException())
      throw new Error('Can not handler without an error');
    return handler(this.exception!);
  }

  handleValue<R>(handler: (v: Result<T>) => R) {
    if (this.isException()) throw new Error('Can not handler without a value');
    return handler(this);
  }

  convertToOther<T>() {
    if (!this.isException())
      throw new Error('Can not convert to other without an error');
    return Result.failure<T>(this.exception!);
  }

  static success<T>(value: T, info?: any) {
    return new Result(value, undefined, info);
  }

  static failure<T>(error: Exception) {
    return new Result<T>(undefined, error);
  }
}
