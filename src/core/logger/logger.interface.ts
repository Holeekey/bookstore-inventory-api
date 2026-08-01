export interface Logger {
  log(...data: string[]): void
  warn(...data: string[]): void
  error(...data: string[]): void
  exception(...data: string[]): void
}
