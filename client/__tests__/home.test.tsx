import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import { STRINGS } from '@/constants/strings.constant';

describe('Home page', () => {
  it('renders the app title without crashing', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { name: STRINGS.home.title })).toBeInTheDocument();
  });
});
