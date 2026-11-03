import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppTitle from '@/components/common/app-title/app-title.component';
import StatCard from '@/components/common/stat-card/stat-card.component';
import { LOGIN_PATH, SESSION_COOKIE } from '@/constants/auth.constant';
import { STRINGS } from '@/constants/strings.constant';
import { getEnv } from '@/helpers/env.helper';
import { hasValidSession } from '@/services/auth.service';
import { countOpenPostings } from '@/services/dashboard.service';
import styles from './dashboard.screen.module.scss';

export default async function DashboardScreen(): Promise<React.JSX.Element> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await hasValidSession(token, getEnv()))) redirect(LOGIN_PATH);

  const openPostings = await countOpenPostings();

  return (
    <main className={styles.screen}>
      <AppTitle text={STRINGS.home.title} />
      <StatCard text={STRINGS.dashboard.openPostings(openPostings)} />
    </main>
  );
}
