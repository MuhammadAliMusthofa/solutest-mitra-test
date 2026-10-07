// Bentuk umum response backend (lihat docs/api-contract.md §1).

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ListParams {
  search?: string;
  page?: number;
  per_page?: number;
  [key: string]: string | number | boolean | undefined;
}

/** Error API yang sudah dinormalisasi interceptor axios. */
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]> | null;
}
