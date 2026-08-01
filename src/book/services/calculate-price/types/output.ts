export class CalculateBookPriceOutput {
  bookId: number
  costUsd: number
  exchangeRate: number
  costLocal: number
  marginPercentage: number
  sellingPriceLocal: number
  currency: string
  calculationTimestamp: Date
}
