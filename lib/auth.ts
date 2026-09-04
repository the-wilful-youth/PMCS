export const isAuthenticated = (): boolean => {
  // In a real app, this would check session, JWT, etc.
  // For MVP, we'll check for a simple token in localStorage (client-side)
  // or a cookie. For simplicity, we'll simulate auth state.
  return typeof window !== 'undefined' &&
         window.localStorage.getItem('isAuthenticated') === 'true';
};

export const login = (username: string, password: string): boolean => {
  // In a real app, this would make an API call
  // For MVP, we'll accept any non-empty credentials
  if (username.trim() && password.trim()) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('isAuthenticated', 'true');
      window.localStorage.setItem('username', username);
    }
    return true;
  }
  return false;
};

export const logout = (): void => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('isAuthenticated');
    window.localStorage.removeItem('username');
  }
};

export const getUsername = (): string | null => {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('username');
  }
  return null;
};