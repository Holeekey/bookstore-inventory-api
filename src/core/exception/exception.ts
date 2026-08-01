export abstract class Exception extends Error {
  code: string
  additionalInfo?: unknown

  constructor(code: string, message: string, additionalInfo?: unknown) {
    super(message)
    this.code = code
    this.additionalInfo = additionalInfo
  }

  get name() {
    return this.constructor.name
  }

  static get exceptionName() {
    return this.prototype.constructor.name
  }
}
