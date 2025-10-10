// =============================================================================
// API & RESPONSE TYPES
// =============================================================================

export interface ApiError {
  error: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

export type GraduationYear = 2025 | 2026 | 2027 | 2028;
