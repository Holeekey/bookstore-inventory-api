import { Global, Module } from '@nestjs/common'
import { UuidGenerator } from './uuid.generator'

@Global()
@Module({
  providers: [UuidGenerator],
  exports: [UuidGenerator],
})
export class UuidModule {}
