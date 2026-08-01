import { Logger as NestJsLogger } from '@nestjs/common'
import { Logger } from '../logger.interface'

export class NestLogger implements Logger {
  constructor(
    title: string,
    private readonly logger = new NestJsLogger(title),
  ) {}

  log(...data: string[]): void {
    this.logger.log(data.join(' '))
  }

  warn(...data: string[]): void {
    this.logger.warn(data.join(' '))
  }

  error(...data: string[]): void {
    this.logger.error('ERROR: ' + data.join(' '))
  }

  exception(...data: string[]): void {
    this.logger.error('EXCEPTION: ' + data.join(' '))
  }
}
