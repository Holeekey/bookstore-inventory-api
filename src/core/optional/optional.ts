type OptionalValue<T> = T | null | undefined

export class Optional<T> {
  constructor(private readonly value: OptionalValue<T>) {
    this.value = value
  }

  static of<T>(value: OptionalValue<T>): Optional<T> {
    return new Optional(value)
  }

  exists(): boolean {
    return this.value !== null && this.value !== undefined
  }

  get(): T {
    if (this.value === null || this.value === undefined) {
      throw new Error('No value present')
    }
    return this.value
  }

  orElse(other: T): T {
    return this.exists() ? this.get() : other
  }
}
