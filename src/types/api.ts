// Typed from budget-buddy-contracts openapi.yaml

export interface AuthToken {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface Category {
  id: string
  name: string
  createdAt?: string
  updatedAt?: string
}

export interface CategoryWrite {
  name: string
}

export interface CategoryUpdate {
  name: string
}

export type TransactionType = 'EXPENSE' | 'INCOME'

export interface Transaction {
  id: string
  categoryId: string
  amount: number // minor units, e.g. 1299 = €12.99
  type: TransactionType
  currency: string
  date: string // YYYY-MM-DD
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface TransactionWrite {
  categoryId: string
  amount: number // minor units
  type: TransactionType
  currency: string
  date: string // YYYY-MM-DD
  description?: string
}

export interface TransactionUpdate {
  categoryId?: string
  amount?: number
  type?: TransactionType
  currency?: string
  date?: string
  description?: string | null
}

export interface PaginationMeta {
  limit: number
  offset: number
  total: number
}

export interface PaginatedCategories {
  items: Category[]
  meta: PaginationMeta
}

export interface PaginatedTransactions {
  items: Transaction[]
  meta: PaginationMeta
}

export interface Problem {
  type?: string
  title: string
  status: number
  detail?: string
  instance?: string
}
