import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'

@Injectable()
export class UuidGenerator {
  generate(): string {
    return randomUUID()
  }
}
