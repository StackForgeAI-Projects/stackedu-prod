// Returns the authenticated user from session.
// TODO: replace stub with real session query once auth is wired.
export function useCurrentUser() {
  return {
    user: null,
    isLoading: false,
    isAuthenticated: false,
  }
}
