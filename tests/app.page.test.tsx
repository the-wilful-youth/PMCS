import { render, screen } from '@testing-library/react';
import { HomePage } from '@/app/page';

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('@/lib/auth', () => ({
  isAuthenticated: jest.fn(() => true),
  getCurrentUser: jest.fn(() => ({
    id: 'u-1',
    username: 'anurag',
    name: 'Anurag',
    email: 'anurag@pmcs.local',
    role: 'admin',
  })),
  logout: jest.fn(),
}));

describe('HomePage', () => {
  test('renders welcome heading and dashboard metrics when authenticated', () => {
    render(<HomePage />);
    const heading = screen.getByRole('heading', { level: 1, name: /project manager portal/i });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText(/project admin/i)).toBeInTheDocument();
    expect(screen.getAllByText(/anurag/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/on track/i)).toBeInTheDocument();
  });
});