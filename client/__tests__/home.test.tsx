import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

// The screen reads cookies and the database (covered in dashboard-screen.test);
// this smoke test only checks the page renders it.
vi.mock('@/screens/dashboard/dashboard.screen', () => ({
  default: (): React.JSX.Element => <h1>dashboard</h1>,
}));

describe('Home page', () => {
  it('renders the dashboard screen without crashing', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { name: 'dashboard' })).toBeInTheDocument();
  });
});
