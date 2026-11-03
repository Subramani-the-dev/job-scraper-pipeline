'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AppTitle from '@/components/common/app-title/app-title.component';
import Button from '@/components/common/button/button.component';
import FormError from '@/components/common/form-error/form-error.component';
import TextInput from '@/components/common/text-input/text-input.component';
import { DASHBOARD_PATH } from '@/constants/auth.constant';
import { STRINGS } from '@/constants/strings.constant';
import { Models } from '@/models/models';
import styles from './login.screen.module.scss';

export default function LoginScreen(): React.JSX.Element {
  const router = useRouter();
  const [state, setState] = useState({ password: '', submitting: false, error: '' });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setState((prev) => ({ ...prev, submitting: true, error: '' }));
    const res = await Models.auth.login({ password: state.password });
    if (res.status === 'success') {
      router.replace(DASHBOARD_PATH);
      router.refresh();
      return;
    }
    setState((prev) => ({ ...prev, submitting: false, error: res.message ?? STRINGS.common.networkError }));
  };

  return (
    <main className={styles.screen}>
      <form className={styles.card} onSubmit={handleSubmit} noValidate>
        <AppTitle text={STRINGS.login.title} />
        <TextInput
          id="password"
          type="password"
          autoComplete="current-password"
          label={STRINGS.login.passwordLabel}
          value={state.password}
          onChange={(password) => setState((prev) => ({ ...prev, password }))}
        />
        {state.error && <FormError message={state.error} />}
        <Button
          type="submit"
          disabled={state.submitting || !state.password}
          label={state.submitting ? STRINGS.login.submitting : STRINGS.login.submit}
        />
      </form>
    </main>
  );
}
