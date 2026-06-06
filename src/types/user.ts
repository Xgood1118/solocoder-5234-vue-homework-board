export type UserRole = 'teacher' | 'student'

export interface User {
  id: string
  name: string
  role: UserRole
  subject?: string
  className?: string
}

export interface AuthState {
  currentUser: User | null
  isLoggedIn: boolean
}
