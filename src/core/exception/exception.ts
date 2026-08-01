export abstract class Exception extends Error {
  code: string
  http: number
  additionalInfo?: unknown

  constructor(
    code: string,
    http: number,
    message: string,
    additionalInfo?: unknown,
  ) {
    super(message)
    this.code = code
    this.http = http
    this.additionalInfo = additionalInfo
  }

  get name() {
    return this.constructor.name
  }

  static get exceptionName() {
    return this.prototype.constructor.name
  }
}
