// =============================================================================
// USER TYPES
// =============================================================================

// Database timestamp type
type Timestamp = Date | string | number;

export interface User {
  netid: string;
  password: string;
  createdAt: Timestamp;
}

// User API response type (what the backend returns)
export interface UserResponse {
  netid: string;
  email: string;
  createdAt: string; // ISO string
}

// User creation response type
export interface CreateUserResponse {
  id: string;
  netid: string;
  email: string;
  message: string;
}

// Login response type
export interface LoginResponse {
  message: string;
  user: UserResponse;
}
