import { DateProvider } from '../ports/date-provider'

export class CurrentDateProvider implements DateProvider {
  get(): Date {
    return new Date()
  }
}
