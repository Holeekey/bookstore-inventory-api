export interface DateProvider {
  get(): Date
}

export const DATE_PROVIDER = Symbol('DateProvider')
