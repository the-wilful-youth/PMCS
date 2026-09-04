import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/login/page';
import { login, isAuthenticated } from '@/lib/auth';

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('@/lib/auth', () => ({
  login: jest.fn(),
  isAuthenticated: jest.fn(),
}));

describe('LoginPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isAuthenticated as jest.Mock).mockReturnValue(false);
  });

  test('renders login form with accessible labels and submit button', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { level: 1, name: /project manager/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('displays error message when login fails', async () => {
    (login as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Invalid username or password.',
    });

    render(<LoginPage />);
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
    fireEvent.change(passwordInput, { target: { value: 'badpass' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid username or password/i);
    });
  });

  test('redirects to dashboard when login succeeds', async () => {
    (login as jest.Mock).mockResolvedValue({
      success: true,
      user: {
        id: 'u-1',
        username: 'anurag',
        name: 'Anurag',
        email: 'anurag@pmcs.local',
        role: 'admin',
      },
    });

    render(<LoginPage />);
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: 'anurag' } });
    fireEvent.change(passwordInput, { target: { value: 'Admin@123456' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/');
    });
  });
});
