import { IsUUID } from 'class-validator'

export class CreateBookOutput {
  @IsUUID()
  id: string
}
