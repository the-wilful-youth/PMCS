import { render, screen } from '@testing-library/react';
import { HomePage } from '@/app/page';

test('renders welcome heading', () => {
  render(<HomePage />);
  const heading = screen.getByRole('heading', { level: 1, name: /project manager portal/i });
  expect(heading).toBeInTheDocument();
});