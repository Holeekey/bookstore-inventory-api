import { DateProvider } from 'src/core/date/ports/date-provider'

export const FIXED_DATE = new Date('2026-01-15T10:30:00.000Z')

export class FixedDateProvider implements DateProvider {
  constructor(private readonly date: Date = FIXED_DATE) {}

  get(): Date {
    return this.date
  }
}
