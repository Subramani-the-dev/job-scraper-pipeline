export const STRINGS = {
  home: { title: 'Job Posting Pipeline' },
  auth: {
    passwordRequired: 'Password is required',
    wrongPassword: 'Wrong password',
    unauthorized: 'Not logged in',
  },
  login: {
    title: 'Log in',
    passwordLabel: 'Password',
    submit: 'Log in',
    submitting: 'Logging in…',
  },
  dashboard: {
    loading: 'Loading…',
    openPostings: (count: number): string => `${count} open posting${count === 1 ? '' : 's'}`,
  },
  common: {
    networkError: 'Could not reach the server. Try again.',
  },
  meta: { description: 'Personal dashboard for the job posting pipeline' },
};
