import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { api } from '@/utils/api.utils';
import { STRINGS } from '@/constants/strings.constant';
import LoginScreen from '@/screens/login/login.screen';
import { Models } from '@/models/models';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, refresh: vi.fn() }) }));

const submit = (password: string): void => {
  fireEvent.change(screen.getByLabelText(STRINGS.login.passwordLabel), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: STRINGS.login.submit }));
};

afterEach(() => vi.restoreAllMocks());

describe('LoginScreen', () => {
  it('goes to the dashboard after a successful login', async () => {
    vi.spyOn(Models.auth, 'login').mockResolvedValue({ status: 'success' });
    render(<LoginScreen />);

    submit('correct-horse');

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(Models.auth.login).toHaveBeenCalledWith({ password: 'correct-horse' });
  });

  it('shows the server message when the password is wrong', async () => {
    vi.spyOn(Models.auth, 'login').mockResolvedValue({ status: 'failed', message: 'Wrong password' });
    render(<LoginScreen />);

    submit('nope');

    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong password');
  });

  it('does not let an empty password be submitted', () => {
    render(<LoginScreen />);

    expect(screen.getByRole('button', { name: STRINGS.login.submit })).toBeDisabled();
  });

  it('shows a network error when the server cannot be reached', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'));
    render(<LoginScreen />);

    submit('correct-horse');

    expect(await screen.findByRole('alert')).toHaveTextContent(STRINGS.common.networkError);
    expect(screen.getByRole('button', { name: STRINGS.login.submit })).toBeEnabled();
  });
});
