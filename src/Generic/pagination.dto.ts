export class PaginationDto {
    page?: number = 1
    limit?: number = 10
    sort?: string
    order?: "asc" | "desc" = "asc"
  }
  
  export interface PaginatedResult<T> {
    data: T[]
    meta: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }
  
  