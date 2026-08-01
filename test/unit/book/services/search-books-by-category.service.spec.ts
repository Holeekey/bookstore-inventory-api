import { Test, TestingModule } from '@nestjs/testing'
import { BookMockRepo } from 'src/book/adapters/repos/book-mock.repo'
import { BOOK_REPO } from 'src/book/ports/book.repo'
import { SearchBooksByCategoryService } from 'src/book/services/search-by-category/search-books-by-category.service'
import { bookEntity } from 'test/utils/book.fixtures'

describe('SearchBooksByCategoryService', () => {
  let service: SearchBooksByCategoryService
  let bookRepo: BookMockRepo

  beforeEach(async () => {
    bookRepo = new BookMockRepo()

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SearchBooksByCategoryService,
        { provide: BOOK_REPO, useValue: bookRepo },
      ],
    }).compile()

    service = moduleRef.get(SearchBooksByCategoryService)
  })

  it('returns only the books matching the category', async () => {
    await bookRepo.save(
      bookEntity({ isbn: '1111111111', category: 'Software' }),
    )
    await bookRepo.save(bookEntity({ isbn: '2222222222', category: 'Fiction' }))
    await bookRepo.save(
      bookEntity({ isbn: '3333333333', category: 'Software' }),
    )

    const result = await service.execute({ category: 'Software' })

    expect(result.isException()).toBe(false)
    expect(result.unwrap()).toHaveLength(2)
    expect(result.unwrap().every((book) => book.category === 'Software')).toBe(
      true,
    )
  })

  it('returns an empty list when no book matches the category', async () => {
    await bookRepo.save(bookEntity({ category: 'Software' }))

    const result = await service.execute({ category: 'Poetry' })

    expect(result.isException()).toBe(false)
    expect(result.unwrap()).toEqual([])
  })

  it('matches categories that contain the term, case-insensitively', async () => {
    await bookRepo.save(
      bookEntity({ isbn: '1111111111', category: 'Literatura Clasica' }),
    )
    await bookRepo.save(
      bookEntity({ isbn: '2222222222', category: 'Software Engineering' }),
    )

    const result = await service.execute({ category: 'literatura' })

    expect(result.isException()).toBe(false)
    expect(result.unwrap()).toHaveLength(1)
    expect(result.unwrap()[0].category).toBe('Literatura Clasica')
  })
})
