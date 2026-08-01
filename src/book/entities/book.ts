export interface Book {
  id?: number
  title: string
  author: string
  isbn: string
  costUsd: number
  sellingPriceLocal: number | null
  stockQuantity: number
  category: string
  supplierCountry: string
  createdAt: Date
  updatedAt: Date
}
