export interface LoginResult {
  success: boolean;
  error?: string;
  user?: {
    username: string;
    role: string;
    name: string;
  };
}

export const isAuthenticated = (): boolean => {
  // In a real app, this would check session, JWT, etc.
  // For MVP, we'll check for a simple token in localStorage (client-side)
  return typeof window !== 'undefined' &&
         window.localStorage.getItem('isAuthenticated') === 'true';
};

export const login = async (usernameInput: string, passwordInput: string): Promise<LoginResult> => {
  const sanitizedUsername = (usernameInput || '').trim().toLowerCase();
  const sanitizedPassword = (passwordInput || '').trim();

  // Input validation
  if (!sanitizedUsername || !sanitizedPassword) {
    return { success: false, error: 'Username and password are required.' };
  }

  if (sanitizedUsername.length > 64 || sanitizedPassword.length > 128) {
    return { success: false, error: 'Input exceeds maximum permitted length.' };
  }

  // Validate against team members from Chronicle_Project_Management_System.xlsx
  const validUsers = [
    { username: 'anurag', password: 'Admin@123456', role: 'admin', name: 'Anurag' },
    { username: 'divyanshi', password: 'Member@123456', role: 'member', name: 'Divyanshi' },
    { username: 'tanishk', password: 'Member@123456', role: 'member', name: 'Tanishk' },
    { username: 'prajjwal', password: 'Member@123456', role: 'member', name: 'Prajjwal' }
  ];

  const user = validUsers.find(
    u => u.username === sanitizedUsername && u.password === sanitizedPassword
  );

  if (user) {
    // Set session data
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('isAuthenticated', 'true');
      window.localStorage.setItem('username', user.username);
      window.localStorage.setItem('userRole', user.role);
      window.localStorage.setItem('userName', user.name);
    }
    return {
      success: true,
      user: {
        username: user.username,
        role: user.role,
        name: user.name
      }
    };
  } else {
    // Failed login attempt
    return { success: false, error: 'Invalid username or password.' };
  }
};

export const logout = (): void => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('isAuthenticated');
    window.localStorage.removeItem('username');
    window.localStorage.removeItem('userRole');
    window.localStorage.removeItem('userName');
  }
};

export const getUsername = (): string | null => {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('username');
  }
  return null;
};

export const getUserRole = (): string | null => {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('userRole');
  }
  return null;
};

export const getUserName = (): string | null => {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('userName');
  }
  return null;
};

export const getCurrentUser = (): { username: string; role: string; name: string } | null => {
  if (typeof window !== 'undefined' && isAuthenticated()) {
    return {
      username: getUsername()!,
      role: getUserRole()!,
      name: getUserName()!
    };
  }
  return null;
};

export const getAuthState = () => ({
  isAuthenticated: isAuthenticated(),
  username: getUsername(),
  role: getUserRole(),
  name: getUserName()
});