export interface Book {
  id: number
  title: string
  author: string
  isbn: string
  costUsd: string
  sellingPriceLocal: number
  stockQuantity: number
  category: string
  supplierCountry: string
  createdAt: Date
  updatedAt: Date
}
